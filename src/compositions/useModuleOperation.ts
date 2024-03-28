import _ from 'lodash';
import { useStore } from 'vuex';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

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

// Types
import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
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
import OperationsFactory from '@/modules/operations/OperationsFactory';
import { Ecosystems } from '@/modules/bridge-dex/enums/Ecosystem.enum';
import TransferOperation from '@/modules/operations/Transfer';
import { IAsset } from '@/shared/models/fields/module-fields';
import { ApproveOperation } from '@/modules/operations/Approve';
import DexOperation from '@/modules/operations/Dex';

const useModuleOperations = (module: ModuleType) => {
    const currentModule = ref(module);

    const {
        walletAddress,
        currentChainInfo,
        setNewChain,
        setChain,
        connectByEcosystems,
        getChainByChainId,
        getConnectedStatus,
        switchEcosystem,
    } = useAdapter();

    const store = useStore();

    const isTransactionSigning = computed({
        get: () => store.getters['txManager/isTransactionSigning'],
        set: (value) => store.dispatch('txManager/setTransactionSigning', value),
    });

    const isForceCallConfirm = computed({
        get: () => store.getters['tokenOps/isForceCallConfirm'](currentModule.value),
        set: (value) =>
            store.dispatch('tokenOps/setCallConfirm', {
                module: currentModule.value,
                value,
            }),
    });

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

        memo,

        selectedRoute,
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

    const currentShortcut = computed<{ id: string; stepId: string }>(() => {
        const shortcutId = store.getters['shortcuts/getCurrentShortcutId'];

        return {
            id: shortcutId,
            stepId: store.getters['shortcuts/getCurrentStepId'],
        };
    });

    const shortcutOps = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](currentShortcut.value.id));

    watch(shortcutOps, (value) => {
        if (!value) return;

        console.log('Shortcut ops:', value);
        console.log('CURRENT MODULE #-------:', JSON.parse(JSON.stringify(module)));

        module = ModuleType.shortcut;
        currentModule.value = ModuleType.shortcut;

        console.log('CURRENT MODULE #shortcut:', JSON.parse(JSON.stringify(module)));
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
    // * Check if need to connect
    // ===============================================================================================

    const ecosystemToConnect = computed(() => {
        const isSuperSwap = module === ModuleType.superSwap;

        // ! If not super swap, return
        if (!isSuperSwap) return;

        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        const isSrcEmpty = isSuperSwap && isSrcAddressesEmpty.value;
        const isDstEmpty = isSuperSwap && isDstAddressesEmpty.value;

        if (isSrcEmpty || isDstEmpty) {
            return isSrcEmpty ? srcEcosystem : dstEcosystem;
        }

        opTitle.value = 'tokenOperations.confirm';

        return null;
    });

    // ===============================================================================================
    // * Operations - Transaction parameters
    // ===============================================================================================

    // const TX_PARAMS_BY_TYPE = {
    //     [TRANSACTION_TYPES.APPROVE]: async (): Promise<IBridgeDexTransaction> => {
    //         const ownerAddress = srcAddressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value;

    //         const params: Approve = {
    //             net: selectedSrcNetwork.value.net,
    //             tokenAddress: selectedSrcToken.value.address,
    //             ownerAddress,
    //             amount: srcAmount.value,
    //         };

    //         const responseApprove: IBridgeDexTransaction[] = await makeApproveRequest(selectedRoute.value.serviceId, params);

    //         const [tx] = responseApprove;

    //         return tx;
    //     },
    //     [TRANSACTION_TYPES.DEX]: async (): Promise<IBridgeDexTransaction> => {
    //         const params = {
    //             net: selectedSrcNetwork.value.net,
    //             fromNet: selectedSrcNetwork.value.net,
    //             toNet: selectedDstNetwork.value?.net || selectedSrcNetwork.value.net,

    //             fromToken: selectedSrcToken.value.address,
    //             toToken: selectedDstToken.value.address,

    //             ownerAddresses: addressByChain.value as OwnerAddresses,
    //             receiverAddress: receiverAddress.value,
    //             amount: srcAmount.value,
    //         } as AllQuoteParams;

    //         // * Bridge transaction, add receiver address to ownerAddresses
    //         if (isSendToAnotherAddress.value && receiverAddress.value) {
    //             params.ownerAddresses = {
    //                 ...addressByChain.value,
    //                 [selectedDstNetwork.value.net]: receiverAddress.value,
    //             };
    //         }

    //         const responseSwap = await makeSwapRequest(selectedRoute.value.serviceId, params, { toType: currentServiceType.value });

    //         const [tx] = responseSwap;

    //         return tx;
    //     },
    //     [TRANSACTION_TYPES.TRANSFER]: async (): Promise<IBridgeDexTransaction> => {
    //         const ownerAddress = srcAddressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value;

    //         const params = {
    //             toAddress: receiverAddress.value,
    //             amount: srcAmount.value,
    //             token: selectedSrcToken.value,
    //             fromAddress: ownerAddress,
    //             memo: '',
    //         };

    //         if (isMemoAllowed && memo.value) {
    //             params.memo = memo.value;
    //         }

    //         return {
    //             ecosystem: selectedSrcNetwork.value.ecosystem,
    //             transaction: params,
    //         };
    //     },
    //     [TRANSACTION_TYPES.STAKE]: async (): Promise<IBridgeDexTransaction> => {
    //         const ownerAddress = srcAddressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value;

    //         const params = {
    //             toAddress: receiverAddress.value,
    //             amount: srcAmount.value,
    //             token: selectedSrcToken.value,
    //             fromAddress: ownerAddress,
    //             memo: '',
    //         };

    //         if (isMemoAllowed && memo.value) {
    //             params.memo = memo.value;
    //         }

    //         return {
    //             ecosystem: selectedSrcNetwork.value.ecosystem,
    //             transaction: params,
    //         };
    //     },
    // };

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
        [TRANSACTION_TYPES.STAKE]: () => {
            console.log('Stake success', 'Update balance');
        },
    };

    // ===============================================================================================
    // * Connect by ecosystem
    // ===============================================================================================

    const connectWalletByEcosystem = async (ecosystem: string) => {
        await connectByEcosystems(ecosystem);
    };

    // ===============================================================================================
    // * Shortcut status
    // ===============================================================================================

    const createOpsByModule = () => {
        const ops = new OperationsFactory();

        if (isNeedApprove.value) {
            ops.registerOperation(module, ApproveOperation);

            ops.setParams(module, 0, {
                net: selectedSrcNetwork.value?.net,
                tokenAddress: selectedSrcToken.value?.address,
                ownerAddress: srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value,
                amount: srcAmount.value,
                serviceId: selectedRoute.value.serviceId,
            });

            ops.getOperationByKey(`${module}_0`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
            ops.getOperationByKey(`${module}_0`).setChainId(selectedSrcNetwork.value?.chain_id);
            ops.getOperationByKey(`${module}_0`).setAccount(srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value);
        }

        const account = srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value;

        switch (module) {
            case ModuleType.stake:
            case ModuleType.send:
                ops.registerOperation(module, TransferOperation);

                ops.setParams(module, 0, {
                    net: selectedSrcNetwork.value?.net,
                    fromNet: selectedSrcNetwork.value?.net,
                    toNet: selectedDstNetwork.value?.net,
                    fromToken: selectedSrcToken.value?.address,
                    toToken: selectedDstToken.value?.address,
                    ownerAddresses: addressByChain.value as OwnerAddresses,
                    amount: srcAmount.value,
                    receiverAddress: receiverAddress.value,
                    memo: memo.value,
                    type: null,
                });

                ops.getOperationByKey(`${module}_0`).setTokens({ from: selectedSrcToken.value, to: selectedDstToken.value });
                ops.getOperationByKey(`${module}_0`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
                ops.getOperationByKey(`${module}_0`).setChainId(selectedSrcNetwork.value?.chain_id);
                ops.getOperationByKey(`${module}_0`).setAccount(account);

                ops.getOperationByKey(`${module}_0`).setTokens({ from: selectedSrcToken.value, to: selectedDstToken.value });

                break;

            case ModuleType.swap:
            case ModuleType.superSwap:
            case ModuleType.bridge:
                const index = isNeedApprove.value ? 1 : 0;
                const type = isSameNetwork.value ? ServiceType.dex : ServiceType.bridgedex;

                ops.registerOperation(module, DexOperation);

                ops.setParams(module, index, {
                    net: selectedSrcNetwork.value?.net,
                    fromNet: selectedSrcNetwork.value?.net,
                    toNet: ModuleType.swap === module ? selectedSrcNetwork.value?.net : selectedDstNetwork.value?.net,
                    fromToken: selectedSrcToken.value?.address,
                    toToken: selectedDstToken.value?.address,
                    ownerAddresses: addressByChain.value as OwnerAddresses,
                    amount: srcAmount.value,
                    receiverAddress: receiverAddress.value,
                    memo: memo.value,
                    serviceId: selectedRoute.value.serviceId,
                    type,
                });

                ops.getOperationByKey(`${module}_${index}`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
                ops.getOperationByKey(`${module}_${index}`).setChainId(selectedSrcNetwork.value?.chain_id);
                ops.getOperationByKey(`${module}_${index}`).setAccount(account);
                ops.getOperationByKey(`${module}_${index}`).setTokens({ from: selectedSrcToken.value, to: selectedDstToken.value });

                console.log('Operations:', ops);

                break;

            default:
                break;
        }

        return ops;
    };

    // ===============================================================================================
    // * Handle on confirm
    // ===============================================================================================

    const handleOnConfirm = async () => {
        if (ecosystemToConnect.value) {
            return await connectWalletByEcosystem(ecosystemToConnect.value);
        }

        isTransactionSigning.value = true;

        let operations = shortcutOps.value;

        console.log('Shortcut operations:', operations);

        // * If operations not provided, create by module
        if (!operations || typeof operations.getFullOperationFlow !== 'function') {
            operations = createOpsByModule();
        }

        if (typeof shortcutOps.value?.getFullOperationFlow === 'function') {
            store.dispatch('shortcuts/setShortcutStatus', {
                status: STATUSES.IN_PROGRESS,
                shortcutId: currentShortcut.value.id,
            });
        }

        // * Get first operation
        const firstInGroup = operations.getFirstOperation();

        // * Create transaction group
        const group = {
            index: 0,
            ecosystem: firstInGroup.getEcosystem(),
            chainId: firstInGroup.getChainId(),
            account: firstInGroup.getAccount(),
            module: firstInGroup.getModule(),
        };

        const OP_FLOW = operations.getFullOperationFlow();

        const ops = OP_FLOW.map((step, i) => {
            return `${i === 0 ? '\t' : ''}${step.index}: ${step.type} [${step.moduleIndex}]\n`;
        }).join(' -> ');

        console.log('----- Operation flow MODULE OPS START -----');
        console.log(ops);
        console.log('----- Operation flow MODULE OPS END -----\n\n');

        try {
            const txManager = new TransactionList(socket.getSocket(), store);

            console.log(`Create transaction group for ${module}`, txManager);
            await txManager.createTransactionGroup(group as ITransaction);

            for (const { index, type, make, moduleIndex } of OP_FLOW) {
                if (operations.getOperationsStatusByKey(moduleIndex) === STATUSES.SUCCESS) {
                    console.log('Operation already success, skip', moduleIndex);
                    continue;
                }

                const tx = new Transaction(type);

                // * Set first transaction ID
                if (index === 0) tx.setId(txManager.getFirstTxId());

                // * Set request ID
                tx.setRequestID(txManager.getRequestId());

                // * Prepare transaction
                tx.prepare = async () => {
                    try {
                        shortcutOps.value.setOperationStatusByKey(moduleIndex, STATUSES.IN_PROGRESS);
                    } catch (error) {
                        console.log(`Error on set operation status by key ${moduleIndex}`);
                    }

                    try {
                        console.log('Prepare:', index, type, 'Transaction', operations.getOperationByKey(moduleIndex).params);

                        const prepared = operations
                            .getOperationByKey(moduleIndex)
                            .perform(
                                index,
                                operations.getOperationByKey(moduleIndex).getAccount(),
                                operations.getOperationByKey(moduleIndex).getEcosystem(),
                                operations.getOperationByKey(moduleIndex).getChainId(),
                                {
                                    make,
                                },
                            );

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
                        const { transaction, ecosystem } = await operations
                            .getOperationByKey(moduleIndex)
                            .performTx(operations.getOperationByKey(moduleIndex).getEcosystem(), {
                                serviceId: operations.getOperationByKey(moduleIndex).getParamByField('serviceId'),
                            });

                        tx.transaction.parameters = transaction;
                        tx.transaction.ecosystem = ecosystem.toUpperCase();

                        tx.setTransactionEcosystem(ecosystem.toUpperCase());
                        tx.setChainId(operations.getOperationByKey(moduleIndex).getChainId());

                        await tx.updateTransactionById(Number(tx.id), tx.transaction);
                    } catch (error) {
                        console.error('useModuleOperations -> setTxExecuteParameters -> error', error);
                        throw error;
                    }
                };

                // * Execute transaction
                tx.execute = async () => {
                    console.debug('-'.repeat(10), 'TX ECOSYSTEM CHECK', '-'.repeat(10), '\n');
                    try {
                        if (getConnectedStatus(tx.getEcosystem())) {
                            console.debug('Already connected to ecosystem try to switch to ecosystem', tx.getEcosystem());
                            await switchEcosystem(tx.getEcosystem());
                            await delay(1000);
                        }

                        if (currentChainInfo.value?.ecosystem !== tx.getEcosystem()) {
                            console.debug('Ecosystem is not connected, try to connect to ecosystem', tx.getEcosystem());
                            await connectByEcosystems(tx.getEcosystem());
                            await delay(1000);
                        }

                        if (currentChainInfo.value?.ecosystem === tx.getEcosystem()) {
                            console.debug('Ecosystem is connected, try to switch to chain', tx.getChainId());
                            const chainInfo = getChainByChainId(tx.getEcosystem(), tx.getChainId());

                            const changed = await setChain(chainInfo);

                            await delay(1000);

                            if (!changed) {
                                throw new Error('Incorrect chain');
                            }
                        }
                    } catch (error) {
                        console.error('useModuleOperations -> execute -> setChain -> error', error);
                        closeNotification(`tx-${tx.getTxId()}`);
                        throw error;
                    }

                    console.debug('-'.repeat(10), 'TX ECOSYSTEM CHECK --- DONE', '-'.repeat(10), '\n\n');

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

                    if (index === OP_FLOW.length - 1) {
                        isTransactionSigning.value = false;

                        if (typeof shortcutOps.value?.getFullOperationFlow === 'function') {
                            store.dispatch('shortcuts/setShortcutStatus', {
                                status: STATUSES.SUCCESS,
                                shortcutId: currentShortcut.value.id,
                            });
                        }
                    }

                    if (shortcutOps.value?.getOperationByKey(moduleIndex)) {
                        shortcutOps.value.getOperationByKey(moduleIndex).setParamByField('txHash', tx.getTransaction().txHash);
                        shortcutOps.value.setOperationStatusByKey(moduleIndex, STATUSES.SUCCESS);
                    }
                };

                tx.onSuccessSignTransaction = async () => {
                    console.log('Success sign and send transaction');

                    if (shortcutOps.value?.getOperationByKey(moduleIndex)) {
                        shortcutOps.value.getOperationByKey(moduleIndex).setParamByField('txHash', tx.getTransaction().txHash);
                        shortcutOps.value.setOperationStatusByKey(moduleIndex, STATUSES.SUCCESS);
                    }

                    console.log('-'.repeat(30), '\n');
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

                    if (shortcutOps.value?.getOperationByKey(moduleIndex)) {
                        shortcutOps.value.setOperationStatusByKey(moduleIndex, STATUSES.FAILED);
                    }

                    if (typeof shortcutOps.value?.getFullOperationFlow === 'function') {
                        store.dispatch('shortcuts/setShortcutStatus', {
                            status: STATUSES.FAILED,
                            shortcutId: currentShortcut.value.id,
                        });
                    }
                };

                txManager.addTransaction(tx);
            }

            if (!txManager.getTransactions().length) {
                console.warn('No transactions to execute');

                shortcutOps.value &&
                    store.dispatch('shortcuts/setShortcutStatus', { status: STATUSES.FAILED, shortcutId: currentShortcut.value.id });

                isTransactionSigning.value = false;

                return;
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
        if (ecosystemToConnect.value) {
            return false;
        }

        const isWithMemo = isSendWithMemo.value && isMemoAllowed.value && !memo.value;
        const isWithAddress = isSendToAnotherAddress.value && (isAddressError.value || !isReceiverAddressSet.value);

        const isQuoteErrorExist = _.isEmpty(quoteErrorMessage.value) ? false : true;

        // * Common
        const isDisabled =
            isLoading.value ||
            isEstimating.value ||
            isQuoteLoading.value ||
            isBalanceError.value ||
            isAllowanceLoading.value ||
            isTransactionSigning.value ||
            isQuoteErrorExist ||
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
    // * Watchers
    // ===============================================================================================

    const unWatchEcosystem = watch(ecosystemToConnect, () => {
        if (!ecosystemToConnect.value) return;

        opTitle.value = `tokenOperations.pleaseConnectWallet${ecosystemToConnect.value}`;
    });

    const unWatchIsForceCallConfirm = watch(isForceCallConfirm, (value) => {
        if (!value) {
            return;
        }

        if (shortcutOps.value) {
        }

        handleOnConfirm();

        isForceCallConfirm.value = false;
    });

    // ===============================================================================================
    // * On unmounted
    // ===============================================================================================

    onUnmounted(() => {
        unWatchEcosystem();
        unWatchIsForceCallConfirm();
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
