import { ModuleType, ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import useAdapter from '@/Adapter/compositions/useAdapter';
import useTransactions from '@/Transactions/compositions/useTransactions';
import { computed, ref } from 'vue';
import useServices from '@/compositions/useServices';
import { TRANSACTION_TYPES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { AllQuoteParams, Approve, OwnerAddresses } from '@/modules/bridge-dex/models/Request.type';
import _ from 'lodash/object';

import { TxOperationFlow } from '@/shared/models/types/Operations';
import { BridgeDexTx, IBridgeDexTransaction } from '@/modules/bridge-dex/models/Response.interface';
import { Transaction, TransactionList } from '@/Transactions/TX-manager';
import { ITransaction, ITransactionResponse } from '../Transactions/types/Transaction';
import socket from '@/app/modules/socket';
import { useStore } from 'vuex';

import { isCorrectChain } from '@/shared/utils/operations';
import { IBaseTransactionParams } from '@/modules/bridge-dex/models/Transaction/EvmTx.type';
import useNotification from './useNotification';
import { ECOSYSTEMS } from '@/Adapter/config';
import { ServiceByModule } from '../modules/bridge-dex/enums/ServiceType.enum';

const useModuleOperations = (module: ModuleType) => {
    const { walletAddress, currentChainInfo, setChain, getAddressesWithChainsByEcosystem } = useAdapter();

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

        selectedSrcNetwork,
        selectedDstNetwork,
        selectedSrcToken,
        selectedDstToken,

        srcAmount,
        selectedRoute,
        memo,
        receiverAddress,

        makeApproveRequest,
        makeSwapRequest,
        makeAllowanceRequest,
        clearAllowance,
    } = moduleInstance;

    const { signAndSend } = useTransactions();

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

        switch (module) {
            case ModuleType.send:
                flow.push({
                    type: TRANSACTION_TYPES.TRANSFER,
                    make: TRANSACTION_TYPES.TRANSFER,
                    index: flow.length,
                });
                break;
            case ModuleType.swap:
                flow.push({
                    type: TRANSACTION_TYPES.DEX,
                    make: TRANSACTION_TYPES.DEX,
                    index: flow.length,
                });
                break;
            case ModuleType.bridge:
                flow.push({
                    type: TRANSACTION_TYPES.DEX,
                    make: TRANSACTION_TYPES.BRIDGE,
                    index: flow.length,
                });
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
        const ownerAddress = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value.ecosystem, { hash: true })[
            selectedSrcNetwork.value.net
        ];

        const params = {
            net: selectedSrcNetwork.value.net,
            fromNet: selectedSrcNetwork.value.net,
            toNet: selectedDstNetwork.value?.net,
            fromToken: selectedSrcToken.value?.address,
            toToken: selectedDstToken.value?.address,
            ownerAddresses: ownerAddress as OwnerAddresses,
            amount: srcAmount.value,
        } as AllQuoteParams;

        const TARGET_TYPE = TRANSACTION_TYPES[type];

        let notificationTitle = `${type} ${srcAmount.value} ${selectedSrcToken.value?.symbol || ''}`;

        if ([TRANSACTION_TYPES.DEX, TRANSACTION_TYPES.SWAP, TRANSACTION_TYPES.BRIDGE].includes(TARGET_TYPE)) {
            notificationTitle += ` to ~${srcAmount.value} ${selectedDstToken.value?.symbol || ''}`;
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
            const ownerAddresses = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value.ecosystem, { hash: true });

            const params = {
                net: selectedSrcNetwork.value.net,
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value?.net || selectedSrcNetwork.value.net,

                fromToken: selectedSrcToken.value.address,
                toToken: selectedDstToken.value.address,

                ownerAddresses: ownerAddresses as OwnerAddresses,
                amount: srcAmount.value,
            } as AllQuoteParams;

            // * Bridge transaction, add receiver address to ownerAddresses
            if (isSendToAnotherAddress.value && receiverAddress.value) {
                params.ownerAddresses = {
                    ...ownerAddresses,
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
    // * Operations - On success
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
        try {
            isTransactionSigning.value = true;

            const isChanged = await isCorrectChain(selectedSrcNetwork, currentChainInfo, setChain);

            if (typeof isChanged === 'boolean' && isChanged === false) {
                return await handleOnConfirm();
            }

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

                tx.setRequestID(txManager.getRequestId());

                tx.prepare = async () => {
                    console.log('Prepare:', index, type, 'Transaction');
                    const prepared = prepare(index, type as TRANSACTION_TYPES);
                    console.log('Prepared:', prepared);
                    const transaction = await txManager.addTransactionToGroup(index, prepared); // * Add or create transaction
                    tx.setId(transaction.id);
                    tx.setTransaction(transaction);
                };

                tx.setTxExecuteParameters = async () => {
                    console.log('Set execute parameters:', index, type, 'Transaction');
                    const params = await TX_PARAMS_BY_TYPE[type]();
                    tx.transaction.parameters = params;
                    await tx.setTransaction(tx.transaction);
                };

                tx.execute = async () => {
                    try {
                        await tx.prepare();

                        const notificationTitle =
                            tx.transaction.metaData.notificationTitle || `${tx.type} ${tx.transaction.metaData.params?.amount} ...`;

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
                        console.error('Error on execute:', error);
                        throw error;
                    } finally {
                        closeNotification('prepare-tx');
                    }
                };

                tx.onSuccess = async () => {
                    if (ON_SUCCESS_BY_TYPE[type]) {
                        await ON_SUCCESS_BY_TYPE[type]();
                    }
                };

                tx.onError = async (error) => {
                    console.error('Transaction error:', error);
                    showNotification({
                        key: 'tx-error',
                        type: 'error',
                        title: 'Transaction error',
                        description: error || JSON.stringify(error),
                        duration: 6,
                    });
                };

                txManager.addTransaction(tx);
            }

            await txManager.executeTransactions();
        } catch (error) {
            console.error('Error on confirm:', error);
        } finally {
            isTransactionSigning.value = false;
        }
    };

    // ===============================================================================================
    // * Confirm button state for each module
    // ===============================================================================================
    const isDisableConfirmButton = computed(() => {
        const isSrcEmpty = !selectedSrcNetwork.value || !selectedSrcToken.value;
        const isRouteEmpty = !selectedRoute.value || !selectedRoute.value.serviceId;

        const isWithMemo = isSendWithMemo.value && isMemoAllowed.value && !memo.value;

        const isWithAddress = isSendToAnotherAddress.value && (isAddressError.value || !receiverAddress.value);

        const isDisabled =
            isSrcEmpty ||
            isLoading.value ||
            isEstimating.value ||
            isQuoteLoading.value ||
            isBalanceError.value ||
            isAllowanceLoading.value ||
            isTransactionSigning.value;

        switch (module) {
            case ModuleType.send:
                return !receiverAddress.value || !srcAmount.value || isDisabled || isWithMemo;
            case ModuleType.swap:
                return !selectedDstToken.value || !srcAmount.value || isDisabled || isRouteEmpty;
            case ModuleType.bridge:
                return (
                    !selectedDstNetwork.value ||
                    !selectedDstToken.value ||
                    !srcAmount.value ||
                    !selectedRoute.value ||
                    isDisabled ||
                    isRouteEmpty ||
                    isWithAddress
                );

            default:
                return isDisabled;
        }
    });

    return {
        handleOnConfirm,
        moduleInstance,

        isDisableConfirmButton,
        isTransactionSigning,
    };
};

export default useModuleOperations;
