import _ from 'lodash/object';
import { useStore } from 'vuex';
import { computed, ref } from 'vue';

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

const useModuleOperations = (module: ModuleType) => {
    const { walletAddress, currentChainInfo, setChain, connectByEcosystems, getAddressesWithChainsByEcosystem } = useAdapter();

    const store = useStore();

    const isTransactionSigning = ref(false);

    const { showNotification, closeNotification } = useNotification();

    const currentServiceType = computed(() => {
        if (selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS) {
            return ServiceType.bridgedex;
        }

        return ServiceType[ServiceByModule[module]];
    });

    // * Module values
    const moduleInstance = useServices({ moduleType: module });

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
        isRequireConnect,
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
    } = moduleInstance;

    const { signAndSend } = useTransactions();

    const {
        isSrcTokenChainCorrect,
        isDstTokenChainCorrect,
        isDstTokenChainCorrectSwap,
        isSrcAmountSet,
        isReceiverAddressSet,
        isQuoteRouteSelected,
        isQuoteRouteSet,
    } = useInputValidation();

    // ===============================================================================================
    // * Addresses with chains by ecosystem
    // ===============================================================================================

    const srcAddressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        if (!srcEcosystem) return {};
        return getAddressesWithChainsByEcosystem(selectedSrcNetwork.value.ecosystem, { hash: true }) as AddressByChainHash;
    });

    const dstAddressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};
        if (!dstEcosystem) return {};
        return getAddressesWithChainsByEcosystem(selectedDstNetwork.value.ecosystem, { hash: true }) as AddressByChainHash;
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

        const isSameNetwork = selectedSrcNetwork.value?.net === selectedDstNetwork.value?.net;
        const isDiffNetwork = selectedSrcNetwork.value?.net !== selectedDstNetwork.value?.net;

        const flowTransfer = {
            type: TRANSACTION_TYPES.TRANSFER,
            make: TRANSACTION_TYPES.TRANSFER,
            index: flow.length,
        };

        const flowDex = {
            type: TRANSACTION_TYPES.DEX,
            make: TRANSACTION_TYPES.DEX,
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
                isSameNetwork && flow.push(flowDex);
                isDiffNetwork && flow.push(flowBridge);
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

    const prepare = (index: number, type: string) => {
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

        let notificationTitle = `${type} ${srcAmount.value} ${selectedSrcToken.value?.symbol || ''}`;

        if ([TRANSACTION_TYPES.DEX, TRANSACTION_TYPES.SWAP, TRANSACTION_TYPES.BRIDGE].includes(TARGET_TYPE)) {
            notificationTitle += ` to ~${dstAmount.value} ${selectedDstToken.value?.symbol || ''}`;
        }

        return {
            index,
            module,
            account: walletAddress.value,

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
        [TRANSACTION_TYPES.APPROVE]: async (): Promise<BridgeDexTx> => {
            const ownerAddress = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value.ecosystem, { hash: true })[
                selectedSrcNetwork.value.net
            ];

            const params: Approve = {
                net: selectedSrcNetwork.value.net,
                tokenAddress: selectedSrcToken.value.address,
                ownerAddress,
                amount: srcAmount.value,
            };

            const responseApprove: IBridgeDexTransaction[] = await makeApproveRequest(selectedRoute.value.serviceId, params);

            const [tx] = responseApprove;

            return tx.transaction;
        },
        [TRANSACTION_TYPES.DEX]: async (): Promise<BridgeDexTx> => {
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

            return tx.transaction;
        },
        [TRANSACTION_TYPES.TRANSFER]: async (): Promise<IBaseTransactionParams> => {
            const ownerAddress = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value.ecosystem, { hash: true })[
                selectedSrcNetwork.value.net
            ];

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

            return params;
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
            if (isRequireConnect.value.isRequire) {
                await connectByEcosystems(isRequireConnect.value.ecosystem);
                return (isTransactionSigning.value = false);
            }
        } catch (error) {
            console.error('Error on connect:', error);
            return (isTransactionSigning.value = false);
        }

        try {
            const isChanged = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            // * If chain is not changed, make one more attempt to confirm
            if (typeof isChanged === 'boolean' && isChanged === false) {
                await handleOnConfirm();
            }
        } catch (error) {
            console.error('Error on chain change:', error);
            return (isTransactionSigning.value = false);
        }

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

            for (const { index, type } of operationFlow.value) {
                const tx = new Transaction(type);

                // * Set request ID
                tx.setRequestID(txManager.getRequestId());

                // * Prepare transaction
                tx.prepare = async () => {
                    console.log('Prepare:', index, type, 'Transaction');
                    const prepared = prepare(index, type as TRANSACTION_TYPES);
                    const transaction = await txManager.addTransactionToGroup(index, prepared); // * Add or create transaction

                    tx.setId(transaction.id);
                    tx.setTransaction(transaction);
                };

                // * Set execute parameters
                tx.setTxExecuteParameters = async () => {
                    console.log('Set execute parameters:', index, type, 'Transaction');
                    const params = await TX_PARAMS_BY_TYPE[type]();
                    tx.transaction.parameters = params;
                    await tx.setTransaction(tx.transaction);
                };

                // * Execute transaction
                tx.execute = async () => {
                    try {
                        await tx.prepare();

                        const notificationTitle =
                            tx.transaction.metaData.notificationTitle || `${tx.type} ${tx.transaction.metaData.params?.amount} ...`;

                        // * Show notification
                        showNotification({
                            key: 'prepare-tx',
                            type: 'info',
                            title: notificationTitle,
                            description: 'Please wait, transaction is preparing',
                            duration: 0,
                        });

                        await tx.setTxExecuteParameters();

                        const forSign = tx.getTransaction();

                        return await signAndSend(forSign);
                    } catch (error) {
                        console.error('useModuleOperations -> execute -> error', error);
                        throw error;
                    } finally {
                        // * Close notification after transaction is signed and sent or failed
                        closeNotification('prepare-tx');
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
        const isSendConfirmDisabled = isDisabled || !isReceiverAddressSet.value || isWithMemo;

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
                return isDisabled || !isQuoteRouteSelected.value || !isQuoteRouteSet.value || isWithAddress;

            default:
                return isDisabled;
        }
    });

    return {
        handleOnConfirm,
        moduleInstance,

        isRequireConnect,
        isDisableConfirmButton,
        isTransactionSigning,
    };
};

export default useModuleOperations;
