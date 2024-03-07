import _ from 'lodash';
import { useStore } from 'vuex';
import { computed, ref, watch, watchEffect } from 'vue';

import socket from '@/app/modules/socket';

// Compositions
import useServices from '@/compositions/useServices';
import useNotification from './useNotification';
import useAdapter from '@/Adapter/compositions/useAdapter';
import useTransactions from '@/Transactions/compositions/useTransactions';

// Config
import { ECOSYSTEMS } from '@/Adapter/config';

// Transaction manager
import { Transaction, TransactionList } from '@/Transactions/TX-manager';

// Utils
import { isCorrectChain } from '@/shared/utils/operations';

// Types
import { ModuleType, ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';
import { TRANSACTION_TYPES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { ServiceByModule } from '../modules/bridge-dex/enums/ServiceType.enum';
import { IBaseTransactionParams } from '@/modules/bridge-dex/models/Transaction/EvmTx.type';
import { ITransaction, ITransactionResponse } from '../Transactions/types/Transaction';
import { BridgeDexTx, IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { AllQuoteParams, Approve, OwnerAddresses } from '@/modules/bridge-dex/models/Request.type';
import { AddressByChainHash } from '../shared/models/types/Address';
import useInputValidation from '@/shared/form-validations';

import { delay } from '@/shared/utils/helpers';

const useModuleOperations = (module: ModuleType) => {
    const { walletAddress, currentChainInfo, setChain, connectByEcosystems, getChainByChainId } = useAdapter();

    const store = useStore();

    const isTransactionSigning = ref(false);

    const { showNotification, closeNotification } = useNotification();

    // * Module values
    const moduleInstance = useServices(module);

    const {
        isNeedApprove,
        isAllowanceLoading,
        isBalanceError,
        isQuoteLoading,
        isLoading,
        isSendWithMemo,
        isMemoAllowed,

        isEstimating,
        isSendToAnotherAddress,
        isAddressError,
        quoteErrorMessage,

        selectedSrcNetwork,
        selectedDstNetwork,
        selectedSrcToken,
        selectedDstToken,

        srcAmount,
        dstAmount,

        selectedRoute,
        memo,
        receiverAddress,

        makeApproveRequest,
        makeSwapRequest,
        clearAllowance,

        opTitle,
    } = moduleInstance;

    const { signAndSend } = useTransactions();

    const {
        isSameNetwork,
        isSrcTokenChainCorrect,
        isDstTokenChainCorrect,
        isDstTokenChainCorrectSwap,
        isSrcAmountSet,
        isReceiverAddressSet,
        isQuoteRouteSelected,
        isQuoteRouteSet,
        isSrcAddressesEmpty,
        isDstAddressesEmpty,
    } = useInputValidation();

    const currentServiceType = computed(() => {
        if (selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS) {
            return ServiceType.bridgedex;
        }

        if (isSameNetwork.value) {
            return ServiceType.dex;
        }

        return ServiceType[ServiceByModule[module]];
    });

    // ===============================================================================================
    // * Addresses with chains by ecosystem
    // ===============================================================================================

    const srcAddressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        if (!srcEcosystem) return {};
        return store.getters['adapters/getAddressesByEcosystem'](srcEcosystem) as AddressByChainHash;
    });

    const dstAddressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};
        if (!dstEcosystem) return {};
        return store.getters['adapters/getAddressesByEcosystem'](dstEcosystem) as AddressByChainHash;
    });

    const addressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        if (srcEcosystem !== dstEcosystem) {
            return {
                ...srcAddressByChain.value,
                ...dstAddressByChain.value,
            };
        }

        return srcAddressByChain.value;
    });

    // ===============================================================================================
    // * Operation actions by transaction type
    // ===============================================================================================
    const OP_ACTIONS = {
        [TRANSACTION_TYPES.APPROVE]: 'formatTransactionForSign',
        [TRANSACTION_TYPES.DEX]: 'formatTransactionForSign',
        [TRANSACTION_TYPES.SWAP]: 'formatTransactionForSign',
        [TRANSACTION_TYPES.TRANSFER]: 'prepareTransaction',
    };

    // ===============================================================================================
    // * Operation flow for the module
    // ===============================================================================================

    const operationFlow = computed<TxOperationFlow[]>(() => {
        const flow = [];

        if (isNeedApprove.value) {
            flow.push({
                type: TRANSACTION_TYPES.APPROVE,
                make: TRANSACTION_TYPES.APPROVE,
                index: flow.length,
            });
        }

        const flowTransfer = {
            type: TRANSACTION_TYPES.TRANSFER,
            make: TRANSACTION_TYPES.TRANSFER,
            index: flow.length,
        };

        const flowDex = {
            type: TRANSACTION_TYPES.DEX,
            make: TRANSACTION_TYPES.SWAP,
            index: flow.length,
        };

        const flowBridge = {
            type: TRANSACTION_TYPES.DEX,
            make: TRANSACTION_TYPES.BRIDGE,
            index: flow.length,
        };

        switch (module) {
            case ModuleType.send:
                flow.push(flowTransfer);
                break;
            case ModuleType.swap:
                flow.push(flowDex);
                break;
            case ModuleType.bridge:
                flow.push(flowBridge);
                break;

            case ModuleType.superSwap:
                isSameNetwork.value && flow.push(flowDex);
                !isSameNetwork.value && flow.push(flowBridge);
                break;
            default:
                break;
        }

        // Flow with all available operations, and in the order of execution
        const ops = flow
            .map((step, i) => {
                return `${step.index}: ${step.type}`;
            })
            .join(' -> ');

        console.log('----- Operation flow START -----');
        console.log(ops);
        console.log('----- Operation flow END -----\n\n');

        // Flow with all available operations, and in the order of execution
        return flow;
    });

    // ===============================================================================================
    // * Operations - Prepare transaction
    // ===============================================================================================

    const prepare = (index: number, type: string, make: string) => {
        const params = {
            net: selectedSrcNetwork.value.net,
            fromNet: selectedSrcNetwork.value.net,
            toNet: selectedDstNetwork.value?.net,
            fromToken: selectedSrcToken.value?.address,
            toToken: selectedDstToken.value?.address,
            ownerAddresses: addressByChain.value as OwnerAddresses,
            amount: srcAmount.value,
        } as AllQuoteParams;

        const TARGET_TYPE = TRANSACTION_TYPES[type];

        let notificationTitle = `${make} ${srcAmount.value} ${selectedSrcToken.value?.symbol || ''}`;

        if ([TRANSACTION_TYPES.DEX, TRANSACTION_TYPES.SWAP, TRANSACTION_TYPES.BRIDGE].includes(TARGET_TYPE)) {
            notificationTitle += ` to ~${dstAmount.value} ${selectedDstToken.value?.symbol || ''}`;
        }

        return {
            index,
            module,
            account: addressByChain.value[selectedSrcNetwork.value.net],

            status: index === 0 ? STATUSES.IN_PROGRESS : STATUSES.PENDING,

            ecosystem: selectedSrcNetwork.value.ecosystem.toUpperCase(),

            chainId: `${selectedSrcNetwork.value?.chain_id}`,

            metaData: {
                action: OP_ACTIONS[TARGET_TYPE],
                type: TARGET_TYPE,
                params: {
                    ...params,
                    receiverAddress: receiverAddress.value,
                    memo: memo.value,
                },
                notificationTitle,
            },
        };
    };

    // ===============================================================================================
    // * Operations - Transaction parameters
    // ===============================================================================================

    const TX_PARAMS_BY_TYPE = {
        [TRANSACTION_TYPES.APPROVE]: async (): Promise<IBridgeDexTransaction> => {
            const ownerAddress = srcAddressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value;

            const params: Approve = {
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress,
                amount: srcAmount.value,
            };

            const responseApprove: IBridgeDexTransaction[] = await makeApproveRequest(selectedRoute.value.serviceId, params);

            const [tx] = responseApprove;

            return tx;
        },
        [TRANSACTION_TYPES.DEX]: async (): Promise<IBridgeDexTransaction> => {
            const params = {
                net: selectedSrcNetwork.value.net,
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value?.net || selectedSrcNetwork.value.net,

                fromToken: selectedSrcToken.value.address,
                toToken: selectedDstToken.value.address,

                ownerAddresses: addressByChain.value as OwnerAddresses,
                receiverAddress: receiverAddress.value,
                amount: srcAmount.value,
            } as AllQuoteParams;

            // * Bridge transaction, add receiver address to ownerAddresses
            if (isSendToAnotherAddress.value && receiverAddress.value) {
                params.ownerAddresses = {
                    ...addressByChain.value,
                    [selectedDstNetwork.value.net]: receiverAddress.value,
                };
            }

            const responseSwap = await makeSwapRequest(selectedRoute.value.serviceId, params, { toType: currentServiceType.value });

            const [tx] = responseSwap;

            return tx;
        },
        [TRANSACTION_TYPES.TRANSFER]: async (): Promise<IBridgeDexTransaction> => {
            const ownerAddress = srcAddressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value;

            const params = {
                toAddress: receiverAddress.value,
                amount: srcAmount.value,
                token: selectedSrcToken.value,
                fromAddress: ownerAddress,
                memo: '',
            };

            if (isMemoAllowed && memo.value) {
                params.memo = memo.value;
            }

            return {
                ecosystem: selectedSrcNetwork.value.ecosystem,
                transaction: params,
            };
        },
    };

    // ===============================================================================================
    // * Operations - On success by transaction type
    // ===============================================================================================

    const ON_SUCCESS_BY_TYPE = {
        [TRANSACTION_TYPES.APPROVE]: async () => {
            console.log('Approve success', 'Update allowance');

            await clearAllowance(selectedRoute.value.serviceId, {
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress: walletAddress.value,
            });
        },
        [TRANSACTION_TYPES.DEX]: () => {
            console.log('Swap success', 'Update balance');
        },
        [TRANSACTION_TYPES.TRANSFER]: () => {
            console.log('Transfer success', 'Update balance');
        },
    };

    // ===============================================================================================
    // * Handle on confirm
    // ===============================================================================================

    const handleOnConfirm = async () => {
        isTransactionSigning.value = true;

        try {
            const group = {
                index: 0,
                ecosystem: selectedSrcNetwork.value.ecosystem,
                account: walletAddress.value,
                chainId: `${selectedSrcNetwork.value?.chain_id}`,
                module,
            };

            const txManager = new TransactionList(socket.getSocket(), store);

            await txManager.createTransactionGroup(group as ITransaction);

            for (const { index, type, make } of operationFlow.value) {
                const tx = new Transaction(type);

                // * Set first transaction ID
                if (index === 0) tx.setId(txManager.getFirstTxId());

                console.log('TX', tx.getTransaction());

                // * Set request ID
                tx.setRequestID(txManager.getRequestId());

                // * Prepare transaction
                tx.prepare = async () => {
                    try {
                        console.log('Prepare:', index, type, 'Transaction');
                        const prepared = prepare(index, type as TRANSACTION_TYPES, make);
                        const transaction = await txManager.addTransactionToGroup(index, prepared); // * Add or create transaction

                        if (index === 0) {
                            const toSave = { ...tx.getTransaction(), ...prepared, id: transaction.id };
                            await tx.updateTransactionById(Number(tx.id), toSave);
                            tx.setTransaction(toSave);
                        } else {
                            tx.setId(transaction.id);
                            tx.setTransaction(transaction);
                        }

                        const notificationTitle =
                            tx.transaction.metaData.notificationTitle || `${tx.type} ${tx.transaction.metaData.params?.amount} ...`;

                        // * Show notification
                        showNotification({
                            key: `tx-${tx.getTxId()}`,
                            type: 'info',
                            title: notificationTitle,
                            description: 'Please wait, transaction is preparing',
                            duration: 0,
                            prepare: true,
                        });
                    } catch (error) {
                        console.error('useModuleOperations -> prepare -> error', error);
                        throw error;
                    }
                };

                // * Set execute parameters
                tx.setTxExecuteParameters = async () => {
                    try {
                        const { transaction, ecosystem } = await TX_PARAMS_BY_TYPE[type]();

                        tx.transaction.parameters = transaction;
                        tx.transaction.ecosystem = ecosystem.toUpperCase();

                        tx.setTransactionEcosystem(ecosystem.toUpperCase());
                        tx.setChainId(selectedSrcNetwork.value?.chain_id);

                        await tx.updateTransactionById(Number(tx.id), tx.transaction);
                    } catch (error) {
                        console.error('useModuleOperations -> setTxExecuteParameters -> error', error);
                        throw error;
                    }
                };

                // * Execute transaction
                tx.execute = async () => {
                    isTransactionSigning.value = true;

                    const { ecosystem: currEcosystem } = currentChainInfo.value || {};

                    try {
                        if (currEcosystem !== tx.getEcosystem()) {
                            await connectByEcosystems(tx.getEcosystem());
                        }

                        if (tx.getChainId() !== currentChainInfo.value?.chain_id) {
                            await delay(1000);
                            const chainInfo = getChainByChainId(tx.getEcosystem(), tx.getChainId());
                            await setChain(chainInfo);
                        }
                    } catch (error) {
                        console.error('useModuleOperations -> execute -> setChain -> error', error);
                        closeNotification(`tx-${tx.getTxId()}`);
                        throw error;
                    }

                    await delay(1000);

                    if (tx.getChainId() !== currentChainInfo.value?.chain_id) {
                        closeNotification(`tx-${tx.getTxId()}`);
                        throw new Error('Incorrect chain');
                    }

                    try {
                        const forSign = tx.getTransaction();

                        return await signAndSend(forSign, { ecosystem: tx.getEcosystem(), chain: tx.getChainId() });
                    } catch (error) {
                        console.error('useModuleOperations -> execute -> error', error);
                        throw error;
                    } finally {
                        // * Close notification after transaction is signed and sent or failed
                        closeNotification(`tx-${tx.getTxId()}`);
                    }
                };

                // * On success
                tx.onSuccess = async () => {
                    if (ON_SUCCESS_BY_TYPE[type]) {
                        await ON_SUCCESS_BY_TYPE[type]();
                    }

                    if (index === operationFlow.value.length - 1) {
                        isTransactionSigning.value = false;
                    }
                };

                tx.onSuccessSignTransaction = async () => {
                    console.log('Success sign and send transaction');

                    if (index === operationFlow.value.length - 1) {
                        isTransactionSigning.value = false;
                    }
                };

                // * On error
                tx.onError = async (error) => {
                    console.error('Error on transaction:', error);
                    const errorMessage = error?.message || JSON.stringify(error);

                    showNotification({
                        key: 'tx-error',
                        type: 'error',
                        title: 'Transaction error',
                        description: errorMessage,
                        duration: 6,
                    });
                };

                txManager.addTransaction(tx);
            }

            await txManager.executeTransactions();
        } catch (error) {
            console.error('useModuleOperations -> handleOnConfirm -> error', error);
        } finally {
            isTransactionSigning.value = false;
        }
    };

    // ===============================================================================================
    // * Confirm button state for each module
    // ===============================================================================================
    const isDisableConfirmButton = computed(() => {
        const isWithMemo = isSendWithMemo.value && isMemoAllowed.value && !memo.value;
        const isWithAddress = isSendToAnotherAddress.value && (isAddressError.value || !isReceiverAddressSet.value);

        // * Common
        const isDisabled =
            isLoading.value ||
            isEstimating.value ||
            isQuoteLoading.value ||
            isBalanceError.value ||
            isAllowanceLoading.value ||
            isTransactionSigning.value ||
            quoteErrorMessage.value ||
            !isSrcAmountSet.value ||
            !isSrcTokenChainCorrect.value;

        // * Send module
        const isSendConfirmDisabled = isDisabled || isAddressError.value || !isReceiverAddressSet.value || isWithMemo;

        // * Swap module
        const isSwapConfirmDisabled =
            isDisabled || !isDstTokenChainCorrectSwap.value || !isQuoteRouteSelected.value || !isQuoteRouteSet.value;

        // * Bridge module
        const isBridgeConfirmDisabled =
            !isQuoteRouteSelected.value || !isQuoteRouteSet.value || isDisabled || !isDstTokenChainCorrect.value || isWithAddress;

        switch (module) {
            case ModuleType.send:
                return isSendConfirmDisabled;
            case ModuleType.swap:
                return isSwapConfirmDisabled;
            case ModuleType.bridge:
                return isBridgeConfirmDisabled;
            case ModuleType.superSwap:
                return (
                    isDisabled ||
                    !isQuoteRouteSelected.value ||
                    !isQuoteRouteSet.value ||
                    (isSameNetwork.value && !isDstTokenChainCorrectSwap.value) ||
                    (!isSameNetwork.value && !isDstTokenChainCorrect.value) ||
                    isWithAddress ||
                    isSrcAddressesEmpty.value ||
                    isDstAddressesEmpty.value
                );
            default:
                return isDisabled ? true : false;
        }
    });

    const isDisableSelect = computed(() => {
        return isQuoteLoading.value || isTransactionSigning.value;
    });

    // ===============================================================================================
    // * Watch for operation title changes
    // ===============================================================================================
    watchEffect(() => {
        const isSuperSwap = module === ModuleType.superSwap;

        // ! If not super swap, return
        if (!isSuperSwap) return;

        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        const isSrcEmpty = isSuperSwap && isSrcAddressesEmpty.value;
        const isDstEmpty = isSuperSwap && isDstAddressesEmpty.value;

        if (isSrcEmpty || isDstEmpty) {
            const ecosystem = isSrcEmpty ? srcEcosystem : dstEcosystem;
            opTitle.value = `tokenOperations.pleaseConnectWallet${ecosystem}`;
        } else {
            opTitle.value = 'tokenOperations.confirm';
        }
    });

    return {
        handleOnConfirm,
        moduleInstance,

        isDisableSelect,
        isTransactionSigning,
        isDisableConfirmButton,
    };
};

export default useModuleOperations;
