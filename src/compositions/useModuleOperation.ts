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
import { TRANSACTION_TYPES, STATUSES, SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';
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
import { IBaseOperation } from '@/modules/operations/models/Operations';

const useModuleOperations = (module: ModuleType) => {
    const store = useStore();

    const currentModule = ref(module);

    const isForceCallConfirm = computed({
        get: () => store.getters['tokenOps/isForceCallConfirm'](currentModule.value),
        set: (value) =>
            store.dispatch('tokenOps/setCallConfirm', {
                module: currentModule.value,
                value,
            }),
    });

    const isTransactionSigning = computed({
        get: () => store.getters['txManager/isTransactionSigning'],
        set: (value) => store.dispatch('txManager/setTransactionSigning', value),
    });

    const setIsTransactionSigning = (from: string, value: boolean) => {
        console.log('########## Set is transaction signing', from, value);
        isTransactionSigning.value = value;
    };

    // *************************** MODULE COMPOSITIONS ***************************

    // ===============================================================================================
    // * Adapter
    // ===============================================================================================

    const { walletAddress, currentChainInfo, setChain, connectByEcosystems, getChainByChainId, getConnectedStatus, switchEcosystem } =
        useAdapter();

    // ===============================================================================================
    // * Notification
    // ===============================================================================================
    const { showNotification, closeNotification } = useNotification();

    // ===============================================================================================
    // * Module values
    // ===============================================================================================
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

        opTitle,
    } = moduleInstance;

    const { signAndSend } = useTransactions();

    // * Input validation composition helpers
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

    // ************************************** SHORTCUTS **************************************

    // ===============================================================================================
    // * Current shortcut
    // ===============================================================================================

    const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);
    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const shortcutIndex = computed(() => store.getters['shortcuts/getShortcutIndex']);
    const firstOp = ref({} as IBaseOperation);

    // ===============================================================================================
    // * Shortcut operations
    // ===============================================================================================
    const shortcutOps = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutId.value));

    const setShortcutStatus = (status: SHORTCUT_STATUSES): void => {
        if (!shortcutOps.value) return;
        if (!currentShortcutId.value) return;

        store.dispatch('shortcuts/setShortcutStatus', {
            status,
            shortcutId: currentShortcutId.value,
        });
    };

    // ===============================================================================================
    // * Shortcut Module type
    // ===============================================================================================
    watch(shortcutOps, (value) => {
        if (!value) return;

        module = ModuleType.shortcut;
        currentModule.value = ModuleType.shortcut;
    });

    // *************************************** WALLET ADDRESSES ***************************************

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
    // ===============================================================================================
    // * Connect by ecosystem
    // ===============================================================================================

    const ecosystemToConnect = computed(() => {
        const isSuperSwap = [ModuleType.superSwap, ModuleType.shortcut].includes(module);

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

    const connectWalletByEcosystem = async (ecosystem: string) => {
        return await connectByEcosystems(ecosystem);
    };

    // ***********************************************************************************************

    // ===============================================================================================
    // * Check wallet connected by ecosystem and chain
    // ===============================================================================================
    const checkWalletConnected = async (tx: Transaction): Promise<boolean> => {
        console.debug('-'.repeat(10), 'TX ECOSYSTEM CHECK', '-'.repeat(10), '\n');

        console.debug('Current ecosystem:', currentChainInfo.value?.ecosystem);
        console.debug('Current chain:', currentChainInfo.value);

        const isEcosystemEqual = () => _.isEqual(currentChainInfo.value?.ecosystem, tx.getEcosystem());
        const isChainsEqual = () => {
            const { ecosystem, chain_id = '' } = currentChainInfo.value || {};

            if (_.isEmpty(chain_id)) return false;

            if ([ECOSYSTEMS.EVM].includes(ecosystem) && typeof chain_id === 'string' && _.startsWith(chain_id, '0x')) {
                return _.isEqual(`${+chain_id}`, tx.getChainId());
            }

            return _.isEqual(`${chain_id}`, tx.getChainId());
        };

        const isEverythingCorrect = () => {
            const isOk = isEcosystemEqual() && isChainsEqual();

            isOk && console.debug('Ecosystem and chain is correct');

            return isOk;
        };

        const generateError = (): string => {
            const ecosystemError = `Ecosystem is not correct, expected ${tx.getEcosystem()}, got ${currentChainInfo.value?.ecosystem}`;
            const chainError = `Chain is not correct, expected ${tx.getChainId()}, got ${currentChainInfo.value?.chain_id}`;

            let errorMessage = '';

            if (!isEcosystemEqual()) errorMessage += ecosystemError + '\n';
            if (!isChainsEqual()) errorMessage += chainError + '\n';

            return errorMessage;
        };

        try {
            // #1 - Check if wallet chain is correct, if correct, skip
            if (isEverythingCorrect()) return;

            // #2 - Check if wallet ecosystem is connected
            if (getConnectedStatus(tx.getEcosystem()) && !isEcosystemEqual()) {
                console.debug('Ecosystem is connected, but not correct, try to switch', tx.getEcosystem());
                await switchEcosystem(tx.getEcosystem());
                await delay(500); // ! Wait for ecosystem switch
            }

            // #3 - If ecosystem is not connected, try to connect
            if (!isEcosystemEqual()) {
                console.debug('Ecosystem is not connected, try to connect', tx.getEcosystem(), 'wallet');
                await connectByEcosystems(tx.getEcosystem());
            }

            // #4 - If ecosystem is connected, but chain is not correct, try to switch chain
            if (isEcosystemEqual() && !isChainsEqual()) {
                console.debug('Ecosystem is connected, but chain is not correct, try to switch', tx.getChainId());

                const chainInfo = getChainByChainId(tx.getEcosystem(), tx.getChainId());

                const changed = await setChain(chainInfo);

                await delay(1200); // ! Wait for chain switch

                if (!changed) throw new Error(generateError());
            }

            // #5 - If ecosystem and chain is correct, return or throw error
            if (isEverythingCorrect()) return;

            throw new Error(generateError());
        } catch (error) {
            console.error('useModuleOperations -> checkWalletConnected -> error', error);
            closeNotification(`tx-${tx.getTxId()}`);
            throw error;
        } finally {
            console.debug('-'.repeat(20));

            console.debug('Current ecosystem:', currentChainInfo.value?.ecosystem);
            console.debug('Current chain:', currentChainInfo.value?.chain_id);

            console.debug('-'.repeat(10), 'TX ECOSYSTEM CHECK - DONE', '-'.repeat(10), '\n');
        }
    };

    // ************************************** OPERATIONS **************************************

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

    const isShortcutOpsExist = () => shortcutOps.value && typeof shortcutOps.value.getFullOperationFlow === 'function';

    const getOperations = (): OperationsFactory => {
        // * If shortcut operations exist, return it
        if (isShortcutOpsExist()) return shortcutOps.value;

        // * if not, create new operations
        return createOpsByModule();
    };

    const initTransactionsGroupForOps = async (operations: OperationsFactory): Promise<TransactionList> => {
        const firstInGroup = operations.getFirstOperation();

        const group = {
            index: 0,
            ecosystem: firstInGroup.getEcosystem(),
            chainId: firstInGroup.getChainId(),
            account: firstInGroup.getAccount(),
            module: firstInGroup.getModule(),
        };

        const txManager = new TransactionList(socket.getSocket(), store);

        try {
            await txManager.createTransactionGroup(group as ITransaction);

            return txManager;
        } catch (error) {
            console.error('initTransactionsGroupForOps -> error', error);
            throw error;
        }
    };

    const insertOrPassApproveOp = (operations: OperationsFactory): void => {
        if (!isNeedApprove.value) return;

        const firstOpKeyByOrder = operations.getFirstOperationByOrder();

        const firstInGroup = operations.getOperationByKey(firstOpKeyByOrder);

        console.log('First in group', firstInGroup);

        if (firstInGroup.transactionType === TRANSACTION_TYPES.APPROVE) return;

        const beforeId = firstInGroup.getUniqueId();

        firstOp.value = firstInGroup;

        const { key } =
            operations.registerOperation(module, ApproveOperation, {
                before: beforeId,
            }) || {};

        const approveOperation = operations.getOperationByKey(key);

        approveOperation.setParams({
            net: selectedSrcNetwork.value?.net,
            tokenAddress: selectedSrcToken.value?.address,
            ownerAddress: srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value,
            amount: srcAmount.value,
            serviceId: selectedRoute.value.serviceId,
        });

        approveOperation.setEcosystem(selectedSrcNetwork.value?.ecosystem);
        approveOperation.setChainId(selectedSrcNetwork.value?.chain_id);
        approveOperation.setAccount(srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value);
        approveOperation.setTokens({ from: selectedSrcToken.value });
    };

    const updateOperationStatus = (
        status: STATUSES,
        {
            moduleIndex,
            operationId,
            hash,
        }: {
            moduleIndex: string;
            operationId?: string;
            hash?: string;
        },
    ): void => {
        const operations = getOperations();

        const firstOpKeyByOrder = operations.getFirstOperationByOrder();
        const firstInGroupByOrder = operations.getOperationByKey(firstOpKeyByOrder);
        const firstInGroup = operations.getFirstOperation();

        console.log('Update operation status', { status, moduleIndex, operationId, hash });

        if (!operations || !status || !moduleIndex) {
            console.warn('updateOperationStatus -> Error: Missing params', { operations, status, moduleIndex });
            return;
        }

        if (!operations.getOperationByKey(moduleIndex) || (operationId && !operations.getOperationById(operationId))) {
            console.error('Operation not found by id/key', moduleIndex, operationId);
            return;
        }

        if (hash) operations.getOperationByKey(moduleIndex).setParamByField('txHash', hash);

        if (firstInGroupByOrder.getUniqueId() === moduleIndex) {
            console.log('First in group', firstInGroup.getUniqueId(), 'Set status:', status);
            operations.setOperationStatusByKey(firstInGroup.getUniqueId(), status);
        }

        if (operationId) return operations.setOperationStatusById(operationId, status);

        operations.setOperationStatusByKey(moduleIndex, status);
    };

    const processTxOperation = (
        txManager: TransactionList,
        operations: OperationsFactory,
        { flow, flowCount }: { flow: TxOperationFlow; flowCount: number },
    ): void => {
        const { index, type, make, moduleIndex, operationId } = flow;

        const checkOpIsExist = (): boolean => {
            console.log('Check operation is exist', index, moduleIndex, operationId);

            if (!operations.getOperationByKey(moduleIndex)) {
                console.error('Operation not found by key', index, moduleIndex);
                return false;
            }

            console.log('Operation is exist', moduleIndex, index, operationId);

            return true;
        };

        // Check if operation already success
        // If operation already success, skip
        if (operations.getOperationsStatusByKey(moduleIndex) === STATUSES.SUCCESS) {
            console.log('Operation already success, skip', moduleIndex);
            return;
        }

        // Create transaction instance
        const txInstance = new Transaction(type);

        // if is first transaction in group, set transaction id
        if (index === 0) txInstance.setId(txManager.getFirstTxId());

        // Set request ID for transaction
        txInstance.setRequestID(txManager.getRequestId());

        // ===============================================================================================
        // * #1 - PREPARE TRANSACTION - function which describe how transaction should be prepared
        // ===============================================================================================
        txInstance.prepare = async () => {
            console.debug('-'.repeat(10), 'TX PREPARE', '-'.repeat(10), '\n\n');

            updateOperationStatus(STATUSES.IN_PROGRESS, { moduleIndex, operationId });

            if (!checkOpIsExist()) return;

            const operation = operations.getOperationByKey(moduleIndex);

            const prepared = operation.perform(index, operation.getAccount(), operation.getEcosystem(), operation.getChainId(), {
                make,
            });

            try {
                const transaction = await txManager.addTransactionToGroup(index, prepared); // * Add or create transaction

                if (!transaction) {
                    console.error('Transaction not added to group', index, type, moduleIndex);
                    return;
                }

                if (index === 0) {
                    const toSave = { ...txInstance.getTransaction(), ...prepared, id: transaction.id };
                    txInstance.setTransaction(toSave);
                } else {
                    txInstance.setId(transaction.id);
                    txInstance.setTransaction(transaction);
                }

                const nTitle =
                    txInstance.transaction.metaData.notificationTitle ||
                    `${txInstance.type} ${txInstance.transaction.metaData.params?.amount} ...`;

                const [title = '', description = ''] = nTitle.split('to');

                // * Show notification
                showNotification({
                    key: `tx-${txInstance.getTxId()}`,
                    type: 'info',
                    title: title,
                    description: description ? `for ${description}` : null,
                    duration: 0,
                    prepare: true,
                });
            } catch (error) {
                console.error('useModuleOperations -> prepare -> error', error);
                throw error;
            }
        };

        // ===============================================================================================
        // * #2 - PREPARE EXECUTE PARAMETERS - function which describe how transaction should have parameters
        // ===============================================================================================
        txInstance.setTxExecuteParameters = async () => {
            if (!checkOpIsExist()) return;

            console.debug('-'.repeat(10), 'TX EXECUTE PARAMS', '-'.repeat(10), '\n\n');

            const operation = operations.getOperationByKey(moduleIndex);

            try {
                const { transaction, ecosystem } = await operation.performTx(operation.getEcosystem(), {
                    serviceId: operation.getParamByField('serviceId'),
                });

                txInstance.setTransaction({
                    ...txInstance.getTransaction(),
                    parameters: transaction,
                });

                txInstance.setTransactionEcosystem(ecosystem.toUpperCase());
                txInstance.setChainId(operation.getChainId());

                await txInstance.updateTransactionById(Number(txInstance.id), txInstance.getTransaction());
            } catch (error) {
                console.error('useModuleOperations -> setTxExecuteParameters -> error', error);
                throw error;
            }
        };

        // ===============================================================================================
        // * #3 - EXECUTE TRANSACTION - function which describe how to execute transaction
        // ===============================================================================================
        txInstance.execute = async () => {
            if (!checkOpIsExist()) return;

            await checkWalletConnected(txInstance);

            console.debug('-'.repeat(10), 'TX EXECUTE', '-'.repeat(10), '\n\n');

            try {
                const forSign = txInstance.getTransaction();

                return await signAndSend(forSign, { ecosystem: txInstance.getEcosystem(), chain: txInstance.getChainId() });
            } catch (error) {
                console.error('useModuleOperations -> execute -> error', error);
                throw error;
            } finally {
                // * Close notification after transaction is signed and sent or failed
                closeNotification(`tx-${txInstance.getTxId()}`);
            }
        };

        // ===============================================================================================
        // * #4 - On success execute transaction
        // ===============================================================================================
        txInstance.onSuccess = async () => {
            if (!checkOpIsExist()) return;

            const operation = operations.getOperationByKey(moduleIndex);

            updateOperationStatus(STATUSES.SUCCESS, { moduleIndex, operationId, hash: txInstance.getTransaction().txHash });

            // * On success by transaction type
            if (operation && operation.onSuccess) {
                await operations.getOperationByKey(moduleIndex).onSuccess(store);
            }

            if (index === flowCount) {
                console.log(
                    'Last operation in group',
                    moduleIndex,
                    'Shortcut index:',
                    shortcutIndex.value,
                    'index:',
                    index,
                    'flowCount:',
                    flowCount,
                );

                setIsTransactionSigning('onSuccess', false);
                isShortcutOpsExist() && setShortcutStatus(SHORTCUT_STATUSES.SUCCESS);
            }
        };

        // ===============================================================================================
        // * On success Sign and send transaction
        // ===============================================================================================
        txInstance.onSuccessSignTransaction = async () => {
            console.log('Success sign and send transaction');

            console.log(
                'operation',
                operations.getOperationByKey(moduleIndex),
                'Status:',
                operations.getOperationsStatusByKey(moduleIndex),
            );

            updateOperationStatus(STATUSES.SUCCESS, { moduleIndex, operationId, hash: txInstance.getTransaction().txHash });

            if (operations?.getOperationByKey(moduleIndex)) {
                console.log('Operation is exist, call next step of operation', moduleIndex);
                const operation = operations.getOperationByKey(moduleIndex);

                const isApprove = operation.transactionType === TRANSACTION_TYPES.APPROVE;

                console.log(`Shortcut operation is exist, call next step of operation, shortcutIndex: ${shortcutIndex.value}`, {
                    isApprove,
                });

                !isApprove &&
                    store.dispatch('shortcuts/nextStep', {
                        shortcutId: currentShortcutId.value,
                        stepId: currentStepId.value,
                    });
            }

            console.log('-'.repeat(30), '\n\n\n');
        };

        // ===============================================================================================
        // !On error execute transaction
        // ===============================================================================================
        txInstance.onError = async (error) => {
            closeNotification(`tx-${txInstance.getTxId()}`);

            const errorMessage = error?.message || JSON.stringify(error);

            showNotification({
                key: 'tx-error',
                type: 'error',
                title: 'Transaction error',
                description: errorMessage,
                duration: 6,
            });

            updateOperationStatus(STATUSES.FAILED, { moduleIndex, operationId, hash: txInstance.getTransaction()?.txHash });

            isShortcutOpsExist() && setShortcutStatus(SHORTCUT_STATUSES.FAILED);
        };

        // If everything is ok, add transaction to manager
        txManager.addTransaction(txInstance);
    };

    const printFlow = (flow: TxOperationFlow[]) => {
        const ops = flow.map((step, i) => `${i === 0 ? '\t' : ''}${step.index}: ${step.type} [${step.moduleIndex}]\n`).join(' -> ');

        console.log('-'.repeat(10), 'Operations flow', '-'.repeat(10));
        console.log(ops);
        console.log('-'.repeat(30), '\n\n');
    };

    // ***********************************************************************************************

    // ===============================================================================================
    // * Handle on confirm
    // ===============================================================================================

    const handleOnConfirm = async () => {
        setIsTransactionSigning('handleOnConfirm', true);

        if (ecosystemToConnect.value) return await connectWalletByEcosystem(ecosystemToConnect.value);

        // ===============================================================================================
        // * Get operations
        // ===============================================================================================

        const operations = getOperations();

        // ! Check if operation need to approve
        insertOrPassApproveOp(operations);

        const opsFullFlow = operations.getFullOperationFlow();

        printFlow(opsFullFlow); // TODO: Remove this after debug

        const txManager = await initTransactionsGroupForOps(operations);

        // ===============================================================================================
        // * Process each operation in flow & add to transaction manager
        // ===============================================================================================

        for (const flow of opsFullFlow) {
            processTxOperation(txManager, operations, { flow, flowCount: opsFullFlow.length - 1 });
        }

        // ===============================================================================================
        // * Execute transactions in group
        // ===============================================================================================
        try {
            isShortcutOpsExist() && setShortcutStatus(SHORTCUT_STATUSES.IN_PROGRESS);

            const isEmptyTxs = !txManager.getTransactions().length || !opsFullFlow.length;

            // ! if no transactions to execute, return
            if (isEmptyTxs) {
                console.warn('No transactions to execute');
                isShortcutOpsExist() && setShortcutStatus(SHORTCUT_STATUSES.SUCCESS);
                setIsTransactionSigning('handleOnConfirm -> isEmptyTxs', false);
                return;
            }

            await txManager.executeTransactions();
        } catch (error) {
            console.error('useModuleOperations -> executeTransactions -> error', error);
            throw error;
        } finally {
            setIsTransactionSigning('handleOnConfirm -> finally', false);
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

    const isDisableSelect = computed(() => isQuoteLoading.value || isTransactionSigning.value);

    // ===============================================================================================
    // * Watchers
    // ===============================================================================================

    const unWatchEcosystem = watch(ecosystemToConnect, () => {
        if (!ecosystemToConnect.value) return;

        opTitle.value = `tokenOperations.pleaseConnectWallet${ecosystemToConnect.value}`;
    });

    const unWatchIsForceCallConfirm = watch(isForceCallConfirm, (value) => {
        if (!value) return;

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
