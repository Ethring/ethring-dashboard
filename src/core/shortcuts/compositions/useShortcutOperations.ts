import { isEqual, isFinite, isNaN, isNumber } from 'lodash';
import BigNumber from 'bignumber.js';

// ********************* Vue/Vuex *********************
import { computed, onUnmounted, ref, watch } from 'vue';
import { useStore, Store } from 'vuex';

// ********************* Compositions *********************
import useNotifications from '@/compositions/useNotification';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

// ********************* Operations *********************
import OperationsFactory from '@/core/operations/OperationsFactory';
import { IBaseOperation } from '@/core/operations/models/Operations';

import DexOperation from '@/core/operations/general-operations/Dex';
import TransferOperation from '@/core/operations/general-operations/Transfer';
import StakeOperation from '@/core/operations/general-operations/Stake';
import ApproveOperation from '@/core/operations/general-operations/Approve';

import MultipleContractExec from '@/core/operations/stargaze-nft/MultipleExec';

import PendleSwapTokenForPT from '@/core/operations/pendle-silo/SwapTokenForPT';
import PendleAddLiquiditySingleToken from '@/core/operations/pendle-beefy/AddLiquiditySingleToken';

import AddLiquidity from '@/core/operations/portal-fi/AddLiquidity';
import RemoveLiquidity from '@/core/operations/portal-fi/RemoveLiquidity';

import BerachainDEX from '@/core/operations/berachain/Dex';

import CallContractMethod from '@/core/operations/evm-contract-ops/CallContractMethod';

// ********************* Shortcuts *********************
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { IShortcutData } from '@/core/shortcuts/core/Shortcut';
import { AvailableShortcuts } from '../data/shortcuts';

// ********************* Shared Models *********************
import { STATUS_TYPE, STATUSES } from '@/shared/models/enums/statuses.enum';
import { AddressByChainHash } from '@/shared/models/types/Address';
import { IAsset } from '@/shared/models/fields/module-fields';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';
import { IChainConfig } from '@/shared/models/types/chain-config';

const useShortcutOperations = (currentShortcutID: string, { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null }) => {
    // ****************************************************************************************************
    // * Store
    // ****************************************************************************************************

    const store = tmpStore || useStore();

    const { closeNotification } = useNotifications();

    // ****************************************************************************************************
    // * Wallet Adapter
    // ****************************************************************************************************

    const { getChainByChainId, setChain, currentChainInfo } = useAdapter({ tmpStore: store });

    // ****************************************************************************************************
    // * Computed Values
    // ****************************************************************************************************

    // ***************************************************************************************************
    // * Get the current operation from the store
    // ***************************************************************************************************
    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const currentShortcut = computed<IShortcutData>(() => store.getters['shortcuts/getShortcut'](currentShortcutID));

    const currentOp = computed<IShortcutOp>(() => {
        if (!currentShortcutID || !currentStepId.value) return null;
        return store.getters['shortcuts/getCurrentOperation'](currentShortcutID);
    });

    const shortcutStatus = computed<STATUS_TYPE>(() => store.getters['shortcuts/getShortcutStatus'](currentShortcutID));

    const operationsCount = computed<number>(() => {
        if (!operationsFactory.value) return 0;
        if (typeof operationsFactory.value.getOperationsCount !== 'function') return 0;
        return operationsFactory.value.getOperationsCount();
    });

    // * Call estimate state to get the quote
    const isCallEstimate = computed({
        get: () => store.getters['shortcuts/getIsCallEstimate'](currentShortcutID),
        set: (value) =>
            store.dispatch('shortcuts/setIsCallEstimate', {
                shortcutId: currentShortcutID,
                value,
            }),
    });

    // * Quote error message
    const quoteErrorMessage = computed({
        get: () => store.getters['bridgeDexAPI/getQuoteErrorMessage'],
        set: (value) => store.dispatch('bridgeDexAPI/setQuoteErrorMessage', value),
    });

    // * Shortcut loading state from the store
    const isShortcutLoading = computed({
        get: () => store.getters['shortcuts/getIsShortcutLoading'](currentShortcutID),
        set: (value) =>
            store.dispatch('shortcuts/setIsShortcutLoading', {
                shortcutId: currentShortcutID,
                value,
            }),
    });

    // * Config loading state from the store
    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    // * Quote loading state from the store
    const isQuoteLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('quote'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value }),
    });

    // * Transaction signing state from the store
    const isTransactionSigning = computed({
        get: () => store.getters['txManager/isTransactionSigning'],
        set: (value) => store.dispatch('txManager/setTransactionSigning', value),
    });

    // * Shortcut index from the store
    const shortcutIndex = computed({
        get: () => store.getters['shortcuts/getShortcutIndex'],
        set: (value) => store.dispatch('shortcuts/setShortcutIndex', { index: value }),
    });

    const slippage = computed({
        get: () => store.getters['tokenOps/slippage'],
        set: (value) => store.dispatch('tokenOps/setSlippage', value),
    });

    // ****************************************************************************************************
    // * Operation's Progress
    // ****************************************************************************************************

    const operationStatus = computed(() => operationsFactory.value?.getOperationsStatusById(currentStepId.value) || STATUSES.PENDING);
    const operationProgress = ref(0);
    const operationProgressStatus = computed(() => {
        if (operationProgress.value === 100) return 'success';
        else if (shortcutStatus.value === STATUSES.FAILED) return 'exception';

        return 'active';
    });

    // ****************************************************************************************************
    // * Address by chain
    // ****************************************************************************************************

    const evmAddresses = computed(() => store.getters['adapters/getAddressesByEcosystem'](Ecosystem.EVM) as AddressByChainHash);
    const cosmosAddresses = computed(() => store.getters['adapters/getAddressesByEcosystem'](Ecosystem.COSMOS) as AddressByChainHash);

    const addressesByChain = computed(() => {
        return {
            ...evmAddresses.value,
            ...cosmosAddresses.value,
        };
    });

    // ****************************************************************************************************
    // * Operations
    // ****************************************************************************************************

    const operationsFactory = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](currentShortcutID));
    const firstOperation = computed<IBaseOperation>(() => {
        if (!operationsFactory.value) return {} as IBaseOperation;
        return operationsFactory.value.getFirstOperation();
    });

    const lastOperation = computed<IBaseOperation>(() => {
        if (!operationsFactory.value) return {} as IBaseOperation;
        return operationsFactory.value.getLastOperation();
    });

    const opIds = computed(() => operationsFactory.value && Array.from(operationsFactory.value.getOperationsIds().keys()));

    const initOperationsFactory = async () => {
        if (!currentShortcutID) {
            console.warn('Shortcut ID not found');
            return false;
        }

        if (!currentShortcut.value) {
            console.warn('Shortcut not found');
            return false;
        }

        const { operations } = currentShortcut.value || {};

        if (!operations || !operations.length) {
            console.warn('No operations found for the shortcut');
            return false;
        }

        await store.dispatch('shortcuts/setShortcutOpsFactory', {
            shortcutId: currentShortcutID,
            operations: new OperationsFactory(),
        });

        return true;
    };

    // ****************************************************************************************************
    // * Perform the operation of the shortcut
    // ****************************************************************************************************
    const processShortcutOperation = async (operation: IShortcutOp) => {
        if (!operation) return false;
        if (!operationsFactory.value) return false;

        let key: string = '';
        let registerResponse = null;

        const { id, moduleType, name, operationType, make, operationParams, waitTime = 3.5, serviceId } = operation || {};

        const registerOptions = { id, name, make };

        switch (operationType) {
            case TRANSACTION_TYPES.BUY:
            case TRANSACTION_TYPES.WRAP:
            case TRANSACTION_TYPES.DEX:
            case TRANSACTION_TYPES.BRIDGE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, DexOperation, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.TRANSFER:
                registerResponse = operationsFactory.value.registerOperation(moduleType, TransferOperation, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.STAKE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, StakeOperation, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.APPROVE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, ApproveOperation, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.EXECUTE_MULTIPLE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, MultipleContractExec, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;

            // * Pendle Operations
            case TRANSACTION_TYPES.CALL_CONTRACT_METHOD:
                registerResponse = operationsFactory.value.registerOperation(moduleType, CallContractMethod, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;

            case TRANSACTION_TYPES.SWAP_TOKEN_TO_PT:
                registerResponse = operationsFactory.value.registerOperation(moduleType, PendleSwapTokenForPT, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;

            case TRANSACTION_TYPES.ADD_LIQUIDITY_SINGLE_TOKEN:
                registerResponse = operationsFactory.value.registerOperation(moduleType, PendleAddLiquiditySingleToken, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.ADD_LIQUIDITY:
                registerResponse = operationsFactory.value.registerOperation(moduleType, AddLiquidity, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.REMOVE_LIQUIDITY:
                registerResponse = operationsFactory.value.registerOperation(moduleType, RemoveLiquidity, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.BERACHAIN_DEX:
                registerResponse = operationsFactory.value.registerOperation(moduleType, BerachainDEX, registerOptions);
                registerResponse && ({ key } = registerResponse);
                break;
        }

        if (!key) return false;

        operationsFactory.value.setWaitTimeByKey(key, waitTime);

        operationsFactory.value.setParamsByKey(key, {
            ...operationParams,
            ownerAddresses: addressesByChain.value,
            serviceId,
            slippage: slippage.value,
        });

        registerResponse && (registerResponse = null);

        return true;
    };

    const setOperationAccount = (stepId: string, { force = false }: { force?: boolean } = {}) => {
        if (!stepId) {
            console.warn('Step ID not found');
            return false;
        }

        if (!operationsFactory.value) {
            console.warn('Operations Factory not found');
            return false;
        }

        const operationById = operationsFactory.value.getOperationById(stepId);
        const operationByKey = operationsFactory.value.getOperationByKey(stepId);

        const operation = operationById || operationByKey;

        if (!operation || (operation && JSON.stringify(operation) === '{}')) {
            console.warn('Operation not found with id:', stepId);
            return false;
        }

        const { net, fromNet } = operation.getParams();

        if (!net && !fromNet) {
            console.warn('No network found for operation:', stepId);
            return false;
        }

        const network = net || fromNet;
        const opAccount = operation.getAccount();
        const account = addressesByChain.value[network];

        if (!account) {
            console.warn('ACCOUNT NOT FOUND', stepId, network, addressesByChain.value[network]);
            return false;
        }

        if (force) {
            console.warn('FORCE SET ACCOUNT', stepId, network, addressesByChain.value[network]);
            operation.setAccount(addressesByChain.value[network]);
            return true;
        }

        if (!opAccount) {
            console.warn('ACCOUNT NOT SET', stepId, network, addressesByChain.value[network]);
            operation.setAccount(addressesByChain.value[network]);
            return true;
        }

        if (opAccount !== account) {
            console.warn('ACCOUNT NOT MATCHED', stepId, network, addressesByChain.value[network]);
            operation.setAccount(addressesByChain.value[network]);
            return true;
        }

        console.warn('ACCOUNT MATCHED', stepId, network, addressesByChain.value[network]);
        return false;
    };

    // ****************************************************************************************************
    // * Check Min USD Amount for the operation
    // ****************************************************************************************************

    const checkMinAmount = () => {
        if (!operationsFactory.value) return false;
        if (!currentShortcut.value) return false;

        const { minUsdAmount = 0 } = currentShortcut.value;

        if (minUsdAmount <= 0 || minUsdAmount === null || minUsdAmount === undefined || !isNumber(minUsdAmount)) return true;

        const TestnetShortcuts = [AvailableShortcuts.BerachainStake, AvailableShortcuts.BerachainVault] as string[];
        if (TestnetShortcuts.includes(currentShortcutID)) return true;

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);
        if (!operation) return false;

        const amount = operation.getParamByField('amount');

        if (!amount) {
            quoteErrorMessage.value = 'Please Fill amount field';
            return false;
        }

        const fromToken = operation.getToken('from');
        const { price = 0 } = fromToken || {};

        const amountToUsd = BigNumber(amount)
            .multipliedBy(price || 0)
            .toString();

        const isGreaterThanMinAmount = BigNumber(amountToUsd).isGreaterThanOrEqualTo(currentShortcut.value.minUsdAmount);

        const isAmountNaN = isNaN(+amountToUsd);

        if (!isGreaterThanMinAmount)
            quoteErrorMessage.value =
                `Min USD amount is: $${currentShortcut.value.minUsdAmount}` + (isAmountNaN ? '' : `,your amount is: $${amountToUsd}`);

        return isGreaterThanMinAmount;
    };

    // ****************************************************************************************************
    // * Call Estimate
    // ****************************************************************************************************

    const operationPrepareAfterEstimate = () => {
        const flow = operationsFactory.value.getFullOperationFlow();

        const withoutApprove = flow.filter((op) => op.type !== TRANSACTION_TYPES.APPROVE);

        for (const op of withoutApprove) {
            const { moduleIndex, operationId } = op || {};

            const operation = operationsFactory.value.getOperationByKey(moduleIndex);

            if (!operationId) continue;

            if (!operation) continue;

            const shortcutOpInfo = store.getters['shortcuts/getShortcutOpInfoById'](currentShortcutID, operationId);
            const { isNeedFromAmount = true } = shortcutOpInfo || {};
            const fromAmount = operation.getParamByField('amount');

            if (isNeedFromAmount && (!fromAmount || isFinite(fromAmount) || fromAmount <= 0) && !quoteErrorMessage.value)
                quoteErrorMessage.value = 'Please Fill all from token amounts';
        }

        if (currentOp.value?.id) {
            const outputAmount = operationsFactory.value.getOperationById(currentOp.value.id)?.getParamByField('outputAmount');
            if (outputAmount && outputAmount > 0) store.dispatch(`tokenOps/setFieldValue`, { field: 'dstAmount', value: outputAmount });
        }
    };

    const handleOnCallEstimateOutput = async () => {
        if (!operationsFactory.value) return false;

        if (isQuoteLoading.value || isTransactionSigning.value || isConfigLoading.value || isShortcutLoading.value) return false;

        const isMinAmountAccepted = checkMinAmount();

        const amount = store.getters['tokenOps/srcAmount'];
        if (amount <= 0 || amount === null || amount === undefined) return false;

        if (!isMinAmountAccepted) {
            console.log('MIN AMOUNT NOT ACCEPTED', quoteErrorMessage.value);
            return (isQuoteLoading.value = false);
        }

        const currentOperation = operationsFactory.value.getOperationById(currentOp.value.id);

        if (currentChainInfo.value?.net !== currentOperation?.tokens.from?.chain) {
            const chainInfo = getChainByChainId(
                currentOperation?.tokens.from?.ecosystem as Ecosystems,
                currentOperation?.tokens.from?.chain as string,
            ) as IChainConfig;
            await setChain(chainInfo);
        }

        try {
            isQuoteLoading.value = true;
            quoteErrorMessage.value = '';
            await operationsFactory.value.estimateOutput(store);
        } catch (error) {
            const { message = 'Error in evaluating output data' } = error || ({} as any);
            quoteErrorMessage.value = message;
        } finally {
            operationPrepareAfterEstimate();
            isQuoteLoading.value = false;
        }
    };

    // ****************************************************************************************************
    // * Try Again
    // ****************************************************************************************************
    const handleOnTryAgain = () => {
        console.log('CALLING TRY AGAIN', shortcutIndex.value, shortcutStatus.value, operationsCount.value - 1);

        const callOnSuccess = () => {
            operationProgress.value = 0;

            store.dispatch('shortcuts/setCurrentStepId', {
                stepId: firstOperation.value.getUniqueId(),
                shortcutId: currentShortcutID,
            });

            store.dispatch('tokenOps/setSrcAmount', null);
            store.dispatch('tokenOps/setDstAmount', null);

            return store.dispatch('shortcuts/resetShortcut', {
                shortcutId: currentShortcutID,
                stepId: firstOperation.value.getUniqueId(),
            });
        };

        const callOnFailOnFirstOp = () => {
            const id = operationsFactory.value.getOperationIdByKey(firstOperation.value.getUniqueId());

            if (currentStepId.value !== id) {
                operationsFactory.value.removeOperationByKey(currentStepId.value);
                operationsFactory.value.removeOperationById(currentStepId.value);
                operationsFactory.value.resetEstimatedOutputs();

                store.dispatch('shortcuts/setCurrentStepId', {
                    stepId: id,
                    shortcutId: currentShortcutID,
                });
            }

            return store.dispatch('shortcuts/setShortcutStatus', {
                shortcutId: currentShortcutID,
                status: STATUSES.PENDING,
            });
        };

        closeNotification('tx-error');

        const isSuccess = [STATUSES.SUCCESS].includes(shortcutStatus.value as any);

        const isFirstOp = currentStepId.value === firstOperation.value.getUniqueId() || shortcutIndex.value === 0;

        if (isFirstOp) return callOnFailOnFirstOp();
        if (isSuccess) return callOnSuccess();

        return store.dispatch('tokenOps/setCallConfirm', {
            module: ModuleType.shortcut,
            value: true,
        });
    };

    const updateProgress = (): number => {
        if (!operationsFactory.value) return 0;
        if (typeof operationsFactory.value.getPercentageOfSuccessOperations !== 'function') return 0;
        return operationsFactory.value.getPercentageOfSuccessOperations();
    };

    // ****************************************************************************************************
    // * Watcher's Handlers
    // ************************************************************************************************

    const handleOnChangeShortcutIndex = async (index: number, oldIndex: number) => {
        if (index === oldIndex) return false;
        if (!operationsFactory.value) return false;
        operationProgress.value = updateProgress();
        return true;
    };

    const handleOnChangeOperationStatus = async (status: string, oldStatus: string) => {
        if (status === oldStatus) return false;
        if (!operationsFactory.value) return false;
        operationProgress.value = updateProgress();
        return true;
    };

    const handleOnChangeIsCallEstimateOutput = async (estimate: boolean, oldEstimate: boolean) => {
        if (!operationsFactory.value) return false;

        if (!estimate) return false;
        if (estimate === oldEstimate) return false;

        await handleOnCallEstimateOutput();

        isCallEstimate.value = false;

        return true;
    };

    const handleOnChangeAddressByChain = async (addressByChain: AddressByChainHash, oldAddressByChain: AddressByChainHash) => {
        if (isEqual(addressByChain, oldAddressByChain)) return false;
        if (!operationsFactory.value) return false;
        if (!opIds.value) return false;
        if (!opIds.value.length) return false;

        for (const id of opIds.value) {
            const operation = operationsFactory.value.getOperationById(id) as IBaseOperation;
            if (!operation) continue;
            operation.setParamByField('ownerAddresses', addressesByChain.value);
        }

        return true;
    };

    const handleOnChangeCurrentStepId = (stepId: string, oldStepId: string) => {
        if (stepId === oldStepId) return false;
        if (!operationsFactory.value) return false;

        setOperationAccount(stepId);

        return true;
    };

    const handleOnUpdateOperationParams = async (
        [srcNet, srcToken, dstNet, dstToken]: any,
        [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken]: any,
    ) => {
        // Helper function to set token parameters
        const setTokenParams = (operation: IBaseOperation | null, type: 'from' | 'to', token: IAsset) => {
            if (!token?.id || currentShortcut.value.isComingSoon) return;

            const { address, base, denom_units } = token || {};

            let tokenAddress = address;
            if (denom_units) tokenAddress = base;

            operation?.setParamByField(`${type}Token`, tokenAddress);
            operation?.setToken(type, token);
        };

        // if config is loading or no operation found, return
        if (isConfigLoading.value || !currentOp.value?.id) return false;
        if (!operationsFactory.value) return false;

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);

        if (
            isEqual(
                [srcNet?.net, srcToken?.id, srcToken?.balance, dstNet?.net, dstToken?.id, dstToken?.balance],
                [oldSrcNet?.net, oldSrcToken?.id, oldSrcToken?.balance, oldDstNet?.net, oldDstToken?.id, oldDstToken?.balance],
            )
        )
            return false;

        if (oldSrcNet?.net !== srcNet?.net && srcNet?.net) {
            // Update srcNet if necessary
            operation?.setEcosystem(srcNet.ecosystem);
            operation?.setChainId((srcNet.chain_id || srcNet.net) as string);
            operation?.setParamByField('net', srcNet.net);
            operation?.setParamByField('fromNet', srcNet.net);
            operation?.setAccount(addressesByChain.value[srcNet.net]);
        }

        // Update dstNet if necessary
        if (oldDstNet?.net !== dstNet?.net && dstNet?.net) operation?.setParamByField('toNet', dstNet.net);

        const { params = [] } = currentOp.value;

        const srcTokenField = params.find((param) => param.name === 'srcToken');
        const dstTokenField = params.find((param) => param.name === 'dstToken');

        // Update srcToken if necessary
        if (
            (oldSrcToken?.id !== srcToken?.id ||
                oldSrcToken?.address !== srcToken?.address ||
                oldSrcToken?.balance !== srcToken?.balance) &&
            !srcTokenField?.value
        )
            setTokenParams(operation, 'from', srcToken);

        // Update dstToken if necessary
        if (
            (oldDstToken?.id !== dstToken?.id ||
                oldDstToken?.address !== dstToken?.address ||
                oldDstToken?.balance !== dstToken?.balance) &&
            dstTokenField &&
            !dstTokenField?.value
        )
            setTokenParams(operation, 'to', dstToken);

        return true;
    };

    const handleOnUpdateOperationParamsAndEstimate = async (
        [srcNet, srcToken, dstNet, dstToken]: any,
        [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken]: any,
    ) => {
        if (!operationsFactory.value) return false;

        // ! if config is loading, return
        if (isConfigLoading.value) return false;

        // ! if no operation found, return
        if (!currentOp.value?.id) return false;

        // !  no srcNet, srcToken, dstNet, dstToken are equal to the oldSrcNet, oldSrcToken, oldDstNet, oldDstToken
        if (
            isEqual(
                [srcNet?.net, srcToken?.id, dstNet?.net, dstToken?.id],
                [oldSrcNet?.net, oldSrcToken?.id, oldDstNet?.net, oldDstToken?.id],
            )
        )
            return false;

        // * Call the estimate output if the srcNet, srcToken
        if (srcNet?.net && srcToken?.id) {
            await handleOnCallEstimateOutput();
            return true;
        }

        return false;
    };

    const updateAmountAndEstimate = async (amount: number, oldAmount: number, isEstimate: boolean = false) => {
        // if config is loading or no operation found, return
        if (isConfigLoading.value || !currentOp.value?.id) return false;
        if (!operationsFactory.value) return false;

        const targetAmount = isEstimate ? 'amount' : 'outputAmount';
        const operation = operationsFactory.value.getOperationById(currentOp.value.id);

        if (typeof amount === 'string' && amount === '') return false;

        const isCorrectAmount = isFinite(+amount) && isNumber(+amount) && amount !== null && amount >= 0;

        // Update amount if necessary
        if (!isEqual(amount, oldAmount) && isCorrectAmount) {
            operation?.setParamByField(targetAmount, amount);
            isEstimate && (await handleOnCallEstimateOutput());
            return true;
        }

        operation?.setParamByField(targetAmount, 0);
        isEstimate && (await handleOnCallEstimateOutput());

        return false;
    };

    const updateContractParams = async (
        contractAddress: string,
        contractCallCount: number,
        oldContractAddress: string,
        oldContractCallCount: number,
    ) => {
        // ! if no operation found, return
        if (!currentOp.value?.id) return false;
        if (!operationsFactory.value) return false;

        // ! if no changes in contractAddress, contractCallCount, return
        if (isEqual([contractAddress, contractCallCount], [oldContractAddress, oldContractCallCount])) return false;

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);

        // Set the contractAddress in the operation if the contractAddress is exist and not equal to the oldContractAddress
        if (oldContractAddress !== contractAddress) operation?.setParamByField('contract', contractAddress);

        // Set the contractCallCount in the operation if the contractCallCount is exist and not equal to the oldContractCallCount
        if (oldContractCallCount !== contractCallCount) operation?.setParamByField('count', contractCallCount);

        return true;
    };

    // ****************************************************************************************************
    // * Watchers
    // ****************************************************************************************************

    const unWatchIsCallEstimate = watch(isCallEstimate, handleOnChangeIsCallEstimateOutput);
    const unWatchAddressByChain = watch(addressesByChain, handleOnChangeAddressByChain);
    const unWatchCurrentStepId = watch(currentStepId, handleOnChangeCurrentStepId);

    const unWatchTokenOpsParams = store.watch(
        (state, getters) => [
            getters['tokenOps/srcNetwork'],
            getters['tokenOps/srcToken'],
            getters['tokenOps/dstNetwork'],
            getters['tokenOps/dstToken'],
        ],
        async ([srcNet, srcToken, dstNet, dstToken], [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken]) => {
            await handleOnUpdateOperationParams([srcNet, srcToken, dstNet, dstToken], [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken]);
            await handleOnUpdateOperationParamsAndEstimate(
                [srcNet, srcToken, dstNet, dstToken],
                [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken],
            );
        },
    );

    const unWatchSrcAmount = store.watch(
        (state, getters) => getters['tokenOps/srcAmount'],
        async (srcAmount, oldSrcAmount) => {
            await updateAmountAndEstimate(srcAmount, oldSrcAmount, true);
        },
    );

    const unWatchDstAmount = store.watch(
        (state, getters) => getters['tokenOps/dstAmount'],
        async (dstAmount, oldDstAmount) => {
            await updateAmountAndEstimate(dstAmount, oldDstAmount, false);
        },
    );

    const unWatchContractParams = store.watch(
        (state, getters) => [getters['tokenOps/contractAddress'], getters['tokenOps/contractCallCount']],
        async ([contractAddress, contractCallCount], [oldContractAddress, oldContractCallCount]) => {
            await updateContractParams(contractAddress, contractCallCount, oldContractAddress, oldContractCallCount);
        },
    );

    const unWatchShortcutIndex = watch(shortcutIndex, handleOnChangeShortcutIndex);
    const unWatchOperationStatus = watch(operationStatus, handleOnChangeOperationStatus);

    // ****************************************************************************************************
    // * UnMounted
    // ****************************************************************************************************

    onUnmounted(() => {
        unWatchIsCallEstimate();
        unWatchAddressByChain();
        unWatchCurrentStepId();

        unWatchShortcutIndex();
        unWatchOperationStatus();

        unWatchTokenOpsParams();

        unWatchSrcAmount();
        unWatchDstAmount();

        unWatchContractParams();
    });

    return {
        operationsFactory,
        currentOp,
        firstOperation,
        lastOperation,

        opIds,

        addressesByChain,

        initOperationsFactory,

        setOperationAccount,
        handleOnCallEstimateOutput,
        processShortcutOperation,

        checkMinAmount,
        handleOnTryAgain,

        updateProgress,

        // Watcher's Handlers
        handleOnChangeIsCallEstimateOutput,
        handleOnChangeAddressByChain,
        handleOnChangeCurrentStepId,
        handleOnChangeShortcutIndex,
        handleOnChangeOperationStatus,
        handleOnUpdateOperationParams,
        handleOnUpdateOperationParamsAndEstimate,
        updateAmountAndEstimate,
        updateContractParams,

        // Operation's Progress

        operationProgress,
        operationProgressStatus,
        operationsCount,
        operationStatus,
    };
};

export default useShortcutOperations;
