import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { isEqual, startsWith, uniq, isEmpty } from 'lodash';

import { ITransaction, ITransactionResponse } from '@/core/transaction-manager/types/Transaction';
import { SHORTCUT_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
// Transaction manager
import { Transaction, TransactionList } from '@/core/transaction-manager/TX-manager';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// Config
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

// Types
import { AddressByChainHash } from '@/shared/models/types/Address';

import MultipleContractExec from '@/core/operations/stargaze-nft/MultipleExec';
import OperationsFactory from '@/core/operations/OperationsFactory';
import ApproveOperation from '@/core/operations/general-operations/Approve';
import TransferOperation from '@/core/operations/general-operations/Transfer';
import DexOperation from '@/core/operations/general-operations/Dex';
import ApproveLpOperation from '@/core/operations/portal-fi/ApproveLp';

import { IBaseOperation } from '@/core/operations/models/Operations';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { OwnerAddresses } from '@/modules/bridge-dex/models/Request.type';
import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { TxOperationFlow } from '@/shared/models/types/Operations';

import { delay } from '@/shared/utils/helpers';
import socket from '@/app/modules/socket';

// Compositions
import useInputValidation from '@/shared/form-validations';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useNotification from '@/compositions/useNotification';
import useServices from '@/compositions/useServices';
import useTransactions from '@/core/transaction-manager/compositions/useTransactions.js';

import { callTrackEvent } from '@/app/modules/mixpanel/track';
import mixpanel from 'mixpanel-browser';
import { IChainConfig } from '@/shared/models/types/chain-config';

const useModuleOperations = (module: ModuleType) => {
    const store = useStore();
    const route = useRouter();

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
    const moduleInstance = useServices(currentModule.value);

    const {
        isInput,
        isNeedApprove,
        isNeedAddLpApprove,
        isNeedRemoveLpApprove,
        isAllowanceLoading,
        isQuoteLoading,
        isLoading,
        isSendWithMemo,
        isMemoAllowed,
        isBalanceError,

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
        contractAddress,
        contractCallCount,
        slippage,
        opTitle,

        getEstimateInfo,
        makeAllowanceRequest,
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

    // const currentServiceType = computed(() => {
    //     if (selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS) return ServiceType.bridgedex;

    //     if (isSameNetwork.value) return ServiceType.dex;

    //     return ServiceType[ServiceByModule[module]];
    // });

    // ************************************** SHORTCUTS **************************************

    // ===============================================================================================
    // * Current shortcut
    // ===============================================================================================

    const currentShortcutId = computed(() => store.getters['shortcuts/getCurrentShortcutId']);
    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](currentShortcutId.value));
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

        if (srcEcosystem !== dstEcosystem)
            return {
                ...srcAddressByChain.value,
                ...dstAddressByChain.value,
            };

        return srcAddressByChain.value;
    });

    // ===============================================================================================
    // * Check if need to connect
    // ===============================================================================================
    // ===============================================================================================
    // * Connect by ecosystem
    // ===============================================================================================

    const ecosystemToConnect = computed<Ecosystems | null>(() => {
        const isSuperSwap = [ModuleType.superSwap, ModuleType.shortcut].includes(currentModule.value);

        // ! If not super swap, return
        if (!isSuperSwap) {
            opTitle.value = `tokenOperations.confirm`;
            return null;
        }

        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        const isSrcEmpty = isSuperSwap && isSrcAddressesEmpty.value;
        const isDstEmpty = isSuperSwap && isDstAddressesEmpty.value;

        if (!isSrcEmpty && !isDstEmpty) {
            opTitle.value = `tokenOperations.confirm`;
            return null;
        }

        if (isSrcEmpty && isDstEmpty) return srcEcosystem;

        if (isSrcEmpty) {
            opTitle.value = `tokenOperations.pleaseConnectWallet${srcEcosystem}`;
            return srcEcosystem;
        }
        if (isDstEmpty) {
            opTitle.value = `tokenOperations.pleaseConnectWallet${dstEcosystem}`;
            return dstEcosystem;
        }

        opTitle.value = `tokenOperations.pleaseConnectWallet${srcEcosystem}`;

        return Ecosystem.EVM;
    });

    // ===============================================================================================
    // * Handle on cancel by timeout
    // ===============================================================================================

    const handleOnCancel = (tx: Transaction) => {
        console.log('useModuleOperations -> handleOnCancel');
        closeNotification(`tx-${tx.getTxId()}`);
        store.dispatch('txManager/setTxTimerID', null);
        store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
        isTransactionSigning.value = false;

        showNotification({
            key: 'tx-error',
            type: 'error',
            title: 'Transaction canceled',
            description: 'Your transaction has been canceled because the response from the node took too long. Please try again.',
            duration: 5,
            progress: true,
        });
    };

    // ***********************************************************************************************

    // ===============================================================================================
    // * Check wallet connected by ecosystem and chain
    // ===============================================================================================
    const checkWalletConnected = async (tx: Transaction): Promise<boolean> => {
        console.debug('-'.repeat(10), 'TX ECOSYSTEM CHECK', '-'.repeat(10), '\n');

        console.debug('Current ecosystem:', currentChainInfo.value?.ecosystem);
        console.debug('Current chain:', currentChainInfo.value?.chain_id);

        const isEcosystemEqual = () => isEqual(currentChainInfo.value?.ecosystem, tx.getEcosystem());

        const isChainsEqual = () => {
            const { ecosystem, chain_id = '' } = currentChainInfo.value || {};

            if ([Ecosystem.EVM].includes(ecosystem as Ecosystem) && typeof chain_id === 'string' && startsWith(chain_id, '0x'))
                return isEqual(`${+chain_id}`, +tx.getChainId());

            return isEqual(`${chain_id}`, tx.getChainId());
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

        const METHODS = {
            ECOSYSTEM_NOT_CONNECT: 'ECOSYSTEM_NOT_CONNECT',
            ECOSYSTEM_CONNECTED_NOT_CORRECT: 'ECOSYSTEM_CONNECTED_NOT_CORRECT',
            ECOSYSTEM_CONNECTED_CHAIN_NOT_CORRECT: 'ECOSYSTEM_CONNECTED_CHAIN_NOT_CORRECT',
        };

        const FLOW_METHODS = {
            [METHODS.ECOSYSTEM_NOT_CONNECT]: async () => {
                console.debug('Ecosystem is not connected, try to connect', tx.getEcosystem(), 'wallet');
                await connectByEcosystems(tx.getEcosystem());
            },
            [METHODS.ECOSYSTEM_CONNECTED_NOT_CORRECT]: async () => {
                console.debug('Ecosystem is connected, but not correct, try to switch', tx.getEcosystem());
                await switchEcosystem(tx.getEcosystem());
                await delay(500); // ! Wait for ecosystem switch
            },
            [METHODS.ECOSYSTEM_CONNECTED_CHAIN_NOT_CORRECT]: async () => {
                console.debug('Ecosystem is connected, but chain is not correct, try to switch', tx.getChainId());
                const chainInfo = getChainByChainId(tx.getEcosystem(), tx.getChainId()) as IChainConfig;
                const changed = await setChain(chainInfo);
                await delay(1200); // ! Wait for chain switch
                if (!changed) throw new Error(generateError());
            },
        };

        const FLOW_CONDITIONS = {
            [METHODS.ECOSYSTEM_NOT_CONNECT]: () => !isEcosystemEqual(),
            [METHODS.ECOSYSTEM_CONNECTED_NOT_CORRECT]: () => getConnectedStatus(tx.getEcosystem()) && !isEcosystemEqual(),
            [METHODS.ECOSYSTEM_CONNECTED_CHAIN_NOT_CORRECT]: () => isEcosystemEqual() && !isChainsEqual(),
        };

        const DEFAULT_FLOW = [
            METHODS.ECOSYSTEM_CONNECTED_NOT_CORRECT,
            METHODS.ECOSYSTEM_NOT_CONNECT,
            METHODS.ECOSYSTEM_CONNECTED_CHAIN_NOT_CORRECT,
        ];

        try {
            // * START: Check if wallet chain is correct, if correct, skip
            if (isEverythingCorrect()) return true;

            for (const method of DEFAULT_FLOW) {
                if (FLOW_CONDITIONS[method]()) await FLOW_METHODS[method]();
                await delay(500); // ! Wait before next check
            }

            // * END: If ecosystem and chain is correct, return or throw error
            if (isEverythingCorrect()) return true;
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
        const account = srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value;

        if (isNeedApprove.value) {
            ops.registerOperation(module, ApproveOperation);

            ops.setParams(module, 0, {
                net: selectedSrcNetwork.value?.net,
                tokenAddress: selectedSrcToken.value?.address,
                ownerAddress: srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value,
                amount: srcAmount.value,
                serviceId: selectedRoute.value.serviceId,
                routeId: selectedRoute.value.routeId,
                dstAmount: dstAmount.value,
            });

            ops.getOperationByKey(`${module}_0`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
            ops.getOperationByKey(`${module}_0`).setChainId(selectedSrcNetwork.value?.chain_id as string);

            ops.getOperationByKey(`${module}_0`).setAccount(account as string);

            ops.getOperationByKey(`${module}_0`).setToken('from', selectedSrcToken.value);
        }

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
                    dstAmount: dstAmount.value,
                });

                ops.getOperationByKey(`${module}_0`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
                ops.getOperationByKey(`${module}_0`).setChainId(selectedSrcNetwork.value?.chain_id as string);
                ops.getOperationByKey(`${module}_0`).setAccount(account as string);

                ops.getOperationByKey(`${module}_0`).setToken('from', selectedSrcToken.value);
                ops.getOperationByKey(`${module}_0`).setToken('to', selectedDstToken.value);

                break;

            case ModuleType.swap:
            case ModuleType.superSwap:
            case ModuleType.bridge:
                const index = isNeedApprove.value ? 1 : 0;
                const type = isSameNetwork.value ? ServiceType.dex : ServiceType.bridgedex;

                ops.registerOperation(module, DexOperation);

                const params = {
                    net: selectedSrcNetwork.value?.net,
                    fromNet: selectedSrcNetwork.value?.net,
                    toNet: ModuleType.swap === module ? selectedSrcNetwork.value?.net : selectedDstNetwork.value?.net,
                    fromToken: selectedSrcToken.value?.address,
                    toToken: selectedDstToken.value?.address,
                    ownerAddresses: addressByChain.value as OwnerAddresses,
                    amount: srcAmount.value,
                    outputAmount: dstAmount.value,
                    memo: memo.value,
                    serviceId: selectedRoute.value?.serviceId,
                    routeId: selectedRoute.value?.routeId,
                    type,
                    slippageTolerance: slippage.value,
                    receiverAddress: receiverAddress.value,
                    dstAmount: dstAmount.value,
                };

                if (isSendToAnotherAddress.value && receiverAddress.value && selectedRoute.value.serviceId === 'skip') {
                    params.ownerAddresses = {
                        ...addressByChain.value,
                        [selectedDstNetwork.value?.net || selectedSrcNetwork.value.net]: receiverAddress.value,
                    };
                } else {
                    const receiverAddressValue = addressByChain.value[selectedDstNetwork.value?.net || selectedSrcNetwork.value?.net];
                    const network = selectedDstNetwork.value?.net || selectedSrcNetwork.value?.net;

                    params.receiverAddress = {
                        [network]: receiverAddress.value || receiverAddressValue,
                    };
                }

                ops.setParams(module, index, params);

                ops.getOperationByKey(`${module}_${index}`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
                ops.getOperationByKey(`${module}_${index}`).setChainId(selectedSrcNetwork.value?.chain_id as string);
                ops.getOperationByKey(`${module}_${index}`).setAccount(account as string);
                selectedSrcToken.value && ops.getOperationByKey(`${module}_${index}`).setToken('from', selectedSrcToken.value);
                selectedDstToken.value && ops.getOperationByKey(`${module}_${index}`).setToken('to', selectedDstToken.value);

                break;

            case ModuleType.nft:
                ops.registerOperation(module, MultipleContractExec);

                ops.setParams(module, 0, {
                    net: selectedSrcNetwork.value?.net,
                    fromNet: selectedSrcNetwork.value?.net,
                    fromToken: selectedSrcToken.value?.address,
                    ownerAddresses: addressByChain.value as OwnerAddresses,
                    amount: srcAmount.value,
                    contract: contractAddress.value,
                    count: contractCallCount.value,
                    type: null,
                    dstAmount: dstAmount.value,
                });

                ops.getOperationByKey(`${module}_0`).setParamByField('contract', contractAddress.value);
                ops.getOperationByKey(`${module}_0`).setParamByField('count', contractCallCount.value);

                ops.getOperationByKey(`${module}_0`).setEcosystem(selectedSrcNetwork.value?.ecosystem);
                ops.getOperationByKey(`${module}_0`).setChainId(selectedSrcNetwork.value?.chain_id as string);
                ops.getOperationByKey(`${module}_0`).setAccount(account as string);

                ops.getOperationByKey(`${module}_0`).setToken('from', selectedSrcToken.value);
                ops.getOperationByKey(`${module}_0`).setToken('to', selectedDstToken.value);

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

        if (!firstInGroup.getAccount()) {
            console.warn('initTransactionsGroupForOps -> Account not found', firstInGroup);

            const chainId = firstInGroup.getChainId();

            const chainInfo = getChainByChainId(firstInGroup.getEcosystem(), chainId);

            const { net = '' } = chainInfo || {};

            const account = srcAddressByChain.value[net] || walletAddress.value;

            account && firstInGroup.setAccount(account);
        }

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
            isTransactionSigning.value = false;
            throw error;
        }
    };

    const checkNeedApprove = (operation: IBaseOperation) => {
        if (operation.module === ModuleType.liquidityProvider) return isNeedAddLpApprove.value;

        return isNeedApprove.value;
    };

    const insertOrPassApproveOp = (operations: OperationsFactory): void => {
        const firstOpKeyByOrder = operations.getFirstOperationByOrder();
        const firstInGroup = operations.getOperationByKey(firstOpKeyByOrder);

        if (!checkNeedApprove(firstInGroup)) return;

        const account = srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value;

        if (firstInGroup.transactionType === TRANSACTION_TYPES.APPROVE) {
            firstInGroup.setParams({
                net: selectedSrcNetwork.value?.net,
                tokenAddress: selectedSrcToken.value?.address,
                ownerAddress: account as string,
                amount: srcAmount.value,
                serviceId: selectedRoute.value?.serviceId,
                dstAmount: dstAmount.value,
            });
            return;
        }

        const beforeId = firstInGroup.getUniqueId();

        firstOp.value = firstInGroup;

        const { key } =
            operations.registerOperation(
                firstInGroup.module,
                firstInGroup.module === ModuleType.liquidityProvider ? ApproveLpOperation : ApproveOperation,
                {
                    before: beforeId,
                },
            ) || {};

        const approveOperation = operations.getOperationByKey(key as string);

        approveOperation.setParams({
            net: selectedSrcNetwork.value?.net,
            tokenAddress: selectedSrcToken.value?.address,
            ownerAddress: account as string,
            amount: srcAmount.value,
            serviceId: selectedRoute.value?.serviceId,
            dstAmount: dstAmount.value,
        });

        approveOperation.setName(`Approve ${selectedSrcToken.value?.symbol}`);
        approveOperation.setEcosystem(selectedSrcNetwork.value?.ecosystem);
        approveOperation.setChainId(selectedSrcNetwork.value?.chain_id as string);
        approveOperation.setAccount(account as string);
        selectedSrcToken.value && approveOperation.setToken('from', selectedSrcToken.value);
    };

    const insertOrPassApproveLpOp = (operations: OperationsFactory): void => {
        if (!isNeedRemoveLpApprove.value) return;

        const operationsFlow = operations.getFullOperationFlow();

        const removeLpExist = operationsFlow.find((op) => op.type === TRANSACTION_TYPES.REMOVE_LIQUIDITY);

        if (!removeLpExist) return;

        const opInGroup = operations.getOperationByKey(removeLpExist.moduleIndex);

        if (opInGroup.isNeedApprove) return;

        opInGroup.setNeedApprove(true);

        const beforeId = opInGroup.getUniqueId();

        const { key } =
            operations.registerOperation(opInGroup.module, ApproveLpOperation, {
                before: beforeId,
            }) || {};

        const approveOperation = operations.getOperationByKey(key as string);

        const account = srcAddressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value;

        approveOperation.setParams({
            net: selectedSrcNetwork.value?.net,
            tokenAddress: opInGroup.tokens.from?.address,
            ownerAddress: account as string,
            amount: +opInGroup.params.amount || srcAmount.value,
            typeLp: TRANSACTION_TYPES.REMOVE_LIQUIDITY,
        });

        approveOperation.setName(`Approve ${opInGroup.tokens.from?.symbol}`);
        approveOperation.setEcosystem(selectedSrcNetwork.value?.ecosystem);
        approveOperation.setChainId(selectedSrcNetwork.value?.chain_id as string);
        approveOperation.setAccount(account as string);

        opInGroup.tokens.from && approveOperation.setToken('from', opInGroup.tokens.from);
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

        if (!operations || !status || !moduleIndex) {
            console.warn('updateOperationStatus -> Error: Missing params', { operations, status, moduleIndex });
            return;
        }

        if ((operationId && !operations.getOperationById(operationId)) || !operations.getOperationByKey(moduleIndex)) {
            console.warn('Operation not found by id/key', moduleIndex, operationId);
            return;
        }

        if (hash) operations.getOperationByKey(moduleIndex).setParamByField('txHash', hash);

        if (firstInGroupByOrder.getUniqueId() === moduleIndex) operations.setOperationStatusByKey(firstInGroup.getUniqueId(), status);

        if (operationId) return operations.setOperationStatusById(operationId, status);

        operations.setOperationStatusByKey(moduleIndex, status);
    };

    const setupWorkerForTx = (tx: Transaction) => {
        if (!tx) {
            console.warn('Transaction not found fo "tx timer worker"');
            return;
        }

        const worker = store.getters['txManager/txTimerWorker'];

        if (!worker) {
            console.warn('Tx timer worker not found');
            return;
        }

        worker.postMessage('start_timer');

        worker.onmessage = function (event: MessageEvent) {
            if (!event.data) return;

            const { timerID } = event.data || {};

            if (timerID) store.dispatch('txManager/setTxTimerID', timerID);
            if (event.data === 'timer_expired') handleOnCancel(tx);
        };
    };

    const getNftTokenIds = (operation: IBaseOperation) => {
        const response = operation.getTxResponse();

        const { events = [] } = response || {};

        const wasmEvents = events.filter((event: any) => event?.type === 'wasm') || [];

        let tokenIdsUnique = null;

        const ids = [];

        console.log('Wasm events:', wasmEvents);

        for (const event of wasmEvents) {
            const { attributes = [] } = event || {};

            const tokenIds = attributes.filter((attr: any) => attr?.key === 'token_id').map((attr: any) => attr?.value) || [];

            if (!tokenIds.length) continue;

            ids.push(...tokenIds);
        }

        tokenIdsUnique = uniq(ids);

        operation.setParamByField('tokenIds', tokenIdsUnique);
    };

    const callNextOperation = (operation: IBaseOperation) => {
        const isApprove = operation.transactionType === TRANSACTION_TYPES.APPROVE;

        if (!isApprove && isShortcutOpsExist())
            store.dispatch('shortcuts/nextStep', {
                shortcutId: currentShortcutId.value,
                stepId: currentStepId.value,
            });
    };

    const processTxOperation = (
        txManager: TransactionList,
        operations: OperationsFactory,
        { flow, flowCount }: { flow: TxOperationFlow; flowCount: number },
    ): void => {
        const { index, type, make, moduleIndex, operationId } = flow;
        const operation = operations.getOperationByKey(moduleIndex);

        const checkOpIsExist = (): boolean => {
            if (!operations.getOperationByKey(moduleIndex)) return false;
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

        txInstance.setIndex(index || 0);
        txInstance.setWaitTime(operation.getWaitTime());

        // if is first transaction in group, set transaction id
        if (index === 0) txInstance.setId(txManager.getFirstTxId());

        // Set request ID for transaction
        txInstance.setRequestID(txManager.getRequestId());

        const isParamsEqual = () => {
            const { fromNet, toNet, fromToken, toToken } = operations.getOperationByKey(moduleIndex).getParams();

            if (!fromNet || !toNet || !fromToken || !toToken) return false;

            const isNetEq = fromNet === toNet;

            const isTokenEq = fromToken === toToken;

            return isNetEq && isTokenEq;
        };

        if (isParamsEqual()) {
            console.log('Params are equal, skip prepare', moduleIndex);
            updateOperationStatus(STATUSES.SKIPPED, { moduleIndex, operationId });
            return callNextOperation(operations.getOperationByKey(moduleIndex));
        }

        // ===============================================================================================
        // * #1 - PREPARE TRANSACTION - function which describe how transaction should be prepared
        // ===============================================================================================
        txInstance.prepare = async () => {
            console.debug('-'.repeat(10), 'TX PREPARE', '-'.repeat(10), '\n\n');

            updateOperationStatus(STATUSES.IN_PROGRESS, { moduleIndex, operationId });

            if (!checkOpIsExist()) return;

            const operation = operations.getOperationByKey(moduleIndex);

            operation.setParamByField('startTime', Number(new Date()));

            if (!operation || !operation.perform) {
                console.warn('Operation not found or perform function not implemented', moduleIndex);
                throw new Error('Operation not found or perform function not implemented');
            }

            const prepared = operation.perform(index as number, operation.getAccount(), operation.getEcosystem(), operation.getChainId(), {
                make,
            });

            try {
                setupWorkerForTx(txInstance);
            } catch (error) {
                console.error('useModuleOperations -> prepare -> setupWorkerForTx -> error', error);
            }

            try {
                const transaction = await txManager.addTransactionToGroup(index as number, prepared); // * Add or create transaction

                if (!transaction) {
                    console.error('Transaction not added to group', index, type, moduleIndex);
                    return;
                }

                if (index === 0) {
                    const toSave = { ...txInstance.getTransaction(), ...prepared, id: transaction.id } as ITransactionResponse;
                    txInstance.setTransaction(toSave);
                } else {
                    txInstance.setId(transaction.id as string);
                    txInstance.setTransaction(transaction);
                }

                // * Track every tx
                callTrackEvent(mixpanel, 'module-app launch', {
                    Modules: route.currentRoute.value.params.id,
                    ServiceId: txInstance.type === TRANSACTION_TYPES.TRANSFER ? 'send' : txInstance.transaction.metaData.params?.serviceId,
                    RequestId: txInstance.requestID,
                });

                // Notification Block

                const { metaData } = txInstance.getTransaction() || ({} as ITransactionResponse);
                const { notificationTitle, notificationDescription } = metaData || {};

                // * Show notification
                showNotification({
                    key: `tx-${txInstance.getTxId()}`,
                    type: 'info',
                    title: notificationTitle || '',
                    description: notificationDescription || '',
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
                if ((operation && !operation.performTx) || typeof operation.performTx !== 'function')
                    throw new Error('Operation performTx function not implemented');

                const performResponse = await operation.performTx(operation.getEcosystem(), {
                    serviceId: operation.getParamByField('serviceId'),
                });

                const { transaction, ecosystem = '' } = performResponse || {};

                txInstance.setTransaction({
                    ...(txInstance.transaction as ITransactionResponse),
                    parameters: transaction || {},
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
        txInstance.execute = async (): Promise<string | null> => {
            if (!checkOpIsExist()) return null;

            await checkWalletConnected(txInstance);

            console.debug('-'.repeat(10), 'TX EXECUTE', '-'.repeat(10), '\n\n');

            try {
                const forSign = txInstance.getTransaction();

                const hash = await signAndSend(forSign, {
                    ecosystem: txInstance.getEcosystem(),
                    chain: txInstance.getChainId(),
                    opInstance: operations.getOperationByKey(moduleIndex),
                });

                return hash.toString();
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
            console.log('Success sign and execute transaction', moduleIndex);

            if (!checkOpIsExist()) return;

            const operation = operations.getOperationByKey(moduleIndex);

            const { txHash } = txInstance.getTransaction() || {};

            operation.setParamByField('endTime', Number(new Date()));

            updateOperationStatus(STATUSES.SUCCESS, { moduleIndex, operationId, hash: txHash as string });

            if (selectedRoute.value?.serviceId)
                await makeAllowanceRequest(selectedRoute.value.serviceId, {
                    net: selectedSrcNetwork.value.net,
                    tokenAddress: selectedSrcToken.value.address,
                    ownerAddress: (addressByChain.value[selectedSrcNetwork.value?.net] || walletAddress.value) as string,
                });

            try {
                // * On success by transaction type
                if (operation && operation.onSuccess) await operation.onSuccess(store);
            } catch (error) {
                console.error('useModuleOperations -> operation -> onSuccess -> error', error);
            }

            if (index === flowCount) {
                isTransactionSigning.value = false;
                isShortcutOpsExist() && setShortcutStatus(SHORTCUT_STATUSES.SUCCESS);
            }
        };

        // ===============================================================================================
        // * On success Sign and send transaction
        // ===============================================================================================
        txInstance.onSuccessSignTransaction = async () => {
            console.log('Success sign and send transaction');

            if (!checkOpIsExist()) return;

            const operation = operations.getOperationByKey(moduleIndex);

            updateOperationStatus(STATUSES.SUCCESS, { moduleIndex, operationId, hash: txInstance.getTransaction().txHash as string });

            // Getting token ids from wasm events
            try {
                if ([ModuleType.nft].includes(operation.getModule() as ModuleType) && Ecosystem.COSMOS === operation.getEcosystem())
                    getNftTokenIds(operation);
            } catch (error) {
                /* empty */
            } finally {
                callNextOperation(operation);
            }

            console.log('-'.repeat(30), '\n\n\n');
        };

        // ===============================================================================================
        // !On error execute transaction
        // ===============================================================================================
        txInstance.onError = async (error) => {
            closeNotification(`tx-${txInstance.getTxId()}`);

            const errorMessage = error?.message || JSON.stringify(error);

            if (errorMessage !== 'Transaction canceled')
                showNotification({
                    key: 'tx-error',
                    type: 'error',
                    title: 'Transaction error',
                    description: errorMessage,
                    duration: 6,
                    progress: true,
                });

            updateOperationStatus(STATUSES.FAILED, { moduleIndex, operationId, hash: txInstance.getTransaction()?.txHash as string });

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
        if (!walletAddress.value) return await connectByEcosystems(selectedSrcNetwork.value?.ecosystem || Ecosystem.EVM);

        if (!selectedSrcNetwork.value) {
            console.warn('Source network not found');
            return;
        }

        try {
            if (ecosystemToConnect.value) return await connectByEcosystems(ecosystemToConnect.value);
        } catch (error) {
            console.error('useModuleOperations -> handleOnConfirm -> connectWalletByEcosystem -> error', error);
            throw error;
        }

        isTransactionSigning.value = true;

        // * Clear route timer if exist
        try {
            if (selectedRoute.value?.routeId && !isShortcutOpsExist())
                await store.dispatch('bridgeDexAPI/clearRouteTimer', {
                    routeId: selectedRoute.value.routeId,
                });
        } catch (error) {
            console.error('useModuleOperations -> handleOnConfirm -> clearRouteTimer -> error', error);
        }

        // ===============================================================================================
        // * Get operations
        // ===============================================================================================

        const operations = getOperations();

        // ! Check if operation need to approve
        insertOrPassApproveOp(operations);
        insertOrPassApproveLpOp(operations);

        const opsFullFlow = operations.getFullOperationFlow();

        printFlow(opsFullFlow); // TODO: Remove this after debug

        const txManager = await initTransactionsGroupForOps(operations);

        // ===============================================================================================
        // * Process each operation in flow & add to transaction manager
        // ===============================================================================================

        for (const flow of opsFullFlow) processTxOperation(txManager, operations, { flow, flowCount: opsFullFlow.length - 1 });

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
                isTransactionSigning.value = false;
                return;
            }

            await txManager.executeTransactions();
        } catch (error) {
            console.error('useModuleOperations -> executeTransactions -> error', error);
            throw error;
        } finally {
            isTransactionSigning.value = false;
            // * if selected route exist, refresh it
            if (selectedRoute.value && [SHORTCUT_STATUSES.PENDING].includes(shortcutStatus.value)) await getEstimateInfo(true);
        }
    };

    // ===============================================================================================
    // * Confirm button state for each module
    // ===============================================================================================
    const isDisableConfirmButton = computed(() => {
        if (ecosystemToConnect.value && !getConnectedStatus(ecosystemToConnect.value as Ecosystems)) return false;

        const isWithMemo = isSendWithMemo.value && isMemoAllowed.value && !memo.value;
        const isWithAddress = isSendToAnotherAddress.value && (isAddressError.value || !isReceiverAddressSet.value);

        const isQuoteErrorExist = isEmpty(quoteErrorMessage.value) ? false : true;

        // * Common
        const isDisabled =
            isInput.value ||
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
                return isDisabled;
        }
    });

    const isDisableSelect = computed(() => isQuoteLoading.value || isTransactionSigning.value);

    // ===============================================================================================
    // * Watchers
    // ===============================================================================================

    const unWatchIsForceCallConfirm = watch(isForceCallConfirm, (value) => {
        if (!value) return;

        handleOnConfirm();

        isForceCallConfirm.value = false;
    });

    // =================================================================================================================

    store.watch(
        (state) => state.bridgeDexAPI.routeTimerSeconds,
        (value) => {
            console.log('useModuleOperations -> store.watch -> value', value);
        },
    );

    onMounted(() => {
        if (ecosystemToConnect.value) setTimeout(() => (opTitle.value = `tokenOperations.pleaseConnectWallet${ecosystemToConnect.value}`));
    });

    // ===============================================================================================
    // * On unmounted
    // ===============================================================================================

    onUnmounted(() => {
        unWatchIsForceCallConfirm();
        isTransactionSigning.value = false;
        isQuoteLoading.value = false;
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
