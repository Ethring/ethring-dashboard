import { isEqual, isFinite } from 'lodash';
import BigNumber from 'bignumber.js';

import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { StepProps } from 'ant-design-vue';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';

import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

// Operations
import OperationsFactory from '@/core/operations/OperationsFactory';
import DexOperation from '@/core/operations/general-operations/Dex';
import TransferOperation from '@/core/operations/general-operations/Transfer';
import StakeOperation from '@/core/operations/general-operations/Stake';
import ApproveOperation from '@/core/operations/general-operations/Approve';
import MultipleContractExec from '@/core/operations/stargaze-nft/MultipleExec';
import PendleSwapTokenForPT from '@/core/operations/pendle-silo/SwapTokenForPT';
import PendleAddLiquiditySingleToken from '@/core/operations/pendle-beefy/AddLiquiditySingleToken';
import AddLiquidity from '@/core/operations/portal-fi/AddLiquidity';
import RemoveLiquidity from '@/core/operations/portal-fi/RemoveLiquidity';

import { IBaseOperation } from '@/core/operations/models/Operations';

// Shortcuts
import ShortcutCl, { IShortcutData } from '@/core/shortcuts/core/Shortcut';
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';
import { IOperationParam } from '@/core/shortcuts/core/models/Operation';

import { IAsset } from '@/shared/models/fields/module-fields';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { AddressByChainHash } from '@/shared/models/types/Address';
import { SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import CallContractMethod from '@/core/operations/evm-contract-ops/CallContractMethod';
import { delay } from '@/shared/utils/helpers';

const useShortcuts = (Shortcut: IShortcutData) => {
    // Create a new instance of the Shortcut class

    const CurrentShortcut = new ShortcutCl(Shortcut);

    // ****************************************************************************************************
    // * Wallet adapter and tokens list
    // ****************************************************************************************************

    const { getChainByChainId, isConnecting, connectedWallets, walletAccount, currentChainInfo } = useAdapter();
    const { getTokenById } = useTokensList();

    // ****************************************************************************************************
    // * Main store and router
    // ****************************************************************************************************

    const store = useStore();
    const router = useRouter();

    // ****************************************************************************************************
    // * Computed properties for the shortcuts
    // ****************************************************************************************************

    // const srcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
    // const dstNetwork = computed(() => store.getters['tokenOps/dstNetwork']);
    // const srcToken = computed(() => store.getters['tokenOps/srcToken']);
    // const dstToken = computed(() => store.getters['tokenOps/dstToken']);

    // * Quote error message
    const quoteErrorMessage = computed({
        get: () => store.getters['bridgeDexAPI/getQuoteErrorMessage'],
        set: (value) => store.dispatch('bridgeDexAPI/setQuoteErrorMessage', value),
    });

    // * Shortcut loading state from the store
    const isShortcutLoading = computed({
        get: () => store.getters['shortcuts/getIsShortcutLoading'](Shortcut.id),
        set: (value) =>
            store.dispatch('shortcuts/setIsShortcutLoading', {
                shortcutId: Shortcut.id,
                value,
            }),
    });

    // * Call estimate state to get the quote
    const isCallEstimate = computed({
        get: () => store.getters['shortcuts/getIsCallEstimate'](Shortcut.id),
        set: (value) =>
            store.dispatch('shortcuts/setIsCallEstimate', {
                shortcutId: Shortcut.id,
                value,
            }),
    });

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

    // * Config loading state from the store
    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    const slippage = computed({
        get: () => store.getters['tokenOps/slippage'],
        set: (value) => store.dispatch('tokenOps/setSlippage', value),
    });

    // ****************************************************************************************************
    // * Current shortcut properties
    // ****************************************************************************************************

    // * Get the current operation from the store
    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const currentOp = computed<IShortcutOp>(() => {
        if (!CurrentShortcut.id || !currentStepId.value) return null;
        return store.getters['shortcuts/getCurrentOperation'](CurrentShortcut.id);
    });
    const shortcutLayout = computed(() => store.getters['shortcuts/getCurrentLayout']);
    const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](CurrentShortcut.id));
    const steps = computed<StepProps[]>(() => store.getters['shortcuts/getShortcutSteps'](CurrentShortcut.id));

    // ****************************************************************************************************
    // * Operations
    // ****************************************************************************************************
    const operationsFactory = computed<OperationsFactory>(() => store.getters['shortcuts/getShortcutOpsFactory'](CurrentShortcut.id));
    const firstOperation = computed<IBaseOperation>(() => operationsFactory.value.getFirstOperation());
    const opIds = computed(() => operationsFactory.value && Array.from(operationsFactory.value.getOperationsIds().keys()));

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
    // * Main process operation function
    // ****************************************************************************************************
    const processOperation = async (
        operation: IShortcutOp,
        { addToFactory = false, updateInStore = false }: { addToFactory: boolean; updateInStore: boolean },
    ) => {
        let key: string = '';
        let registerResponse = null;

        const { id, moduleType, name, operationType, make, operationParams, waitTime = 3.5, serviceId, params = [] } = operation || {};

        if (!addToFactory)
            return await performFields(moduleType, params, {
                isUpdateInStore: updateInStore,
                id,
            });

        if (!operationsFactory.value) return;

        switch (operationType) {
            case TRANSACTION_TYPES.BUY:
            case TRANSACTION_TYPES.WRAP:
            case TRANSACTION_TYPES.DEX:
            case TRANSACTION_TYPES.BRIDGE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, DexOperation, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.TRANSFER:
                registerResponse = operationsFactory.value.registerOperation(moduleType, TransferOperation, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.STAKE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, StakeOperation, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.APPROVE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, ApproveOperation, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.EXECUTE_MULTIPLE:
                registerResponse = operationsFactory.value.registerOperation(moduleType, MultipleContractExec, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;

            // * Pendle Operations
            case TRANSACTION_TYPES.CALL_CONTRACT_METHOD:
                registerResponse = operationsFactory.value.registerOperation(moduleType, CallContractMethod, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;

            case TRANSACTION_TYPES.SWAP_TOKEN_TO_PT:
                registerResponse = operationsFactory.value.registerOperation(moduleType, PendleSwapTokenForPT, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;

            case TRANSACTION_TYPES.ADD_LIQUIDITY_SINGLE_TOKEN:
                registerResponse = operationsFactory.value.registerOperation(moduleType, PendleAddLiquiditySingleToken, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.ADD_LIQUIDITY:
                registerResponse = operationsFactory.value.registerOperation(moduleType, AddLiquidity, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
            case TRANSACTION_TYPES.REMOVE_LIQUIDITY:
                registerResponse = operationsFactory.value.registerOperation(moduleType, RemoveLiquidity, { id, name, make });
                registerResponse && ({ key } = registerResponse);
                break;
        }

        if (!key) return;

        operationsFactory.value.setWaitTimeByKey(key, waitTime);

        operationsFactory.value.setParamsByKey(key, {
            ...operationParams,
            ownerAddresses: addressesByChain.value,
            serviceId,
            slippage,
        });

        await performFields(moduleType, params, {
            isUpdateInStore: currentOp.value?.id === id,
            id,
        });

        registerResponse && (registerResponse = null);
    };

    // ****************************************************************************************************
    // * Perform the shortcut operations
    // ****************************************************************************************************
    const performShortcut = async (addToFactory = false, updateInStore = false) => {
        // ! if no operations factory found, return
        if (!operationsFactory.value) return;

        const { operations = [] } = CurrentShortcut || {};

        // ! if operations already exists in the factory, no need to add them again
        if (operationsFactory.value.getOperationsIds().size >= operations.length) {
            console.warn('Operations already exists');
            return;
        }

        // * Process the operations
        for (const shortcutOperation of operations) {
            const { id: opId, dependencies: opDeps = null } = shortcutOperation as any;

            await processOperation(shortcutOperation as IShortcutOp, { addToFactory, updateInStore });

            opDeps && operationsFactory.value.setDependencies(opId, opDeps);
        }
    };

    // ****************************************************************************************************
    // * Perform the shortcut operations state
    // ****************************************************************************************************
    const performDisabledOrHiddenFields = (opId: string, module: string, fields: IOperationParam[]) => {
        const isUpdateInStore = currentOp.value?.id === opId;
        if (!isUpdateInStore) return;

        if (!fields.length) return;
        if (!opId) return;
        if (!module) return;

        const setDisabled = (field: string, value: boolean) => {
            store.dispatch('moduleStates/setDisabledField', {
                module,
                field,
                attr: 'disabled',
                value,
            });
        };

        const setHide = (field: string, value: boolean) => {
            store.dispatch('moduleStates/setHideField', {
                module,
                field,
                attr: 'hide',
                value,
            });
        };

        for (const field of fields) {
            const { name, disabled = false, hide = false } = field || {};
            setDisabled(name, disabled);
            setHide(name, hide);
        }
    };

    // ****************************************************************************************************
    // * Check the minimum amount
    // ****************************************************************************************************
    const checkMinAmount = () => {
        const amount = firstOperation.value.getParamByField('amount') || 0;

        if (!amount) return true;

        if (CurrentShortcut.minUsdAmount === undefined || CurrentShortcut.minUsdAmount === null) return true;

        const fromToken = firstOperation.value.getToken('from');

        const { price = 0 } = fromToken || {};

        const amountToUsd = BigNumber(amount)
            .multipliedBy(price || 0)
            .toString();

        const isGreaterThanMinAmount = BigNumber(amountToUsd).isGreaterThanOrEqualTo(CurrentShortcut.minUsdAmount);

        const isAmountNaN = isNaN(+amountToUsd);

        if (!isGreaterThanMinAmount)
            quoteErrorMessage.value =
                `Min USD amount is: $${CurrentShortcut.minUsdAmount}` + (isAmountNaN ? '' : `,your amount is: $${amountToUsd}`);

        return isGreaterThanMinAmount;
    };

    // ****************************************************************************************************
    // * Perform the default values
    // ****************************************************************************************************
    const performDefaultValues = async (
        fields: IOperationParam[],
        {
            targetOpId,
            isUpdateInStore,
        }: {
            targetOpId: string;
            isUpdateInStore: boolean;
        },
    ) => {
        if (!targetOpId) return;

        for (const paramField of fields) {
            const {
                name: field,
                ecosystem = null,
                chainId = null,
                chain = null,
                id = null,
                address,
                memo,
                amount = null,
                value = null,
            } = paramField || {};

            const fieldsAssociated = {
                srcNetwork: 'fromNet',
                dstNetwork: 'toNet',
                srcToken: 'fromToken',
                dstToken: 'toToken',
                receiverAddress: 'receiverAddress',
                contractAddress: 'contract',
                memo: 'memo',
            } as any;

            const isToken = ['srcToken', 'dstToken'].includes(field);

            const tokenDestination = {
                srcToken: 'from',
                dstToken: 'to',
            } as any;

            if (field && value) {
                isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value }));

                isToken ? operationsFactory.value?.getOperationById(targetOpId)?.setToken(tokenDestination[field], value) : null;

                fieldsAssociated[field]
                    ? operationsFactory.value?.getOperationById(targetOpId)?.setParamByField(fieldsAssociated[field], value)
                    : null;

                continue;
            }

            switch (field) {
                case 'srcNetwork':
                case 'dstNetwork':
                    const srcDstNet = getChainByChainId(ecosystem as Ecosystems, chainId as string);

                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: srcDstNet }));

                    const isSrc = field === 'srcNetwork';

                    if (!srcDstNet) return;

                    const srcChainId = (srcDstNet.chain_id || srcDstNet.net) as string;

                    isSrc
                        ? operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('fromNet', srcDstNet?.net)
                        : operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('toNet', srcDstNet?.net);

                    isSrc ? operationsFactory.value?.getOperationById(targetOpId)?.setChainId(srcChainId) : null;
                    isSrc ? operationsFactory.value?.getOperationById(targetOpId)?.setEcosystem(srcDstNet.ecosystem as any) : null;

                    isSrc ? operationsFactory.value?.getOperationById(targetOpId)?.setAccount(addressesByChain.value[srcDstNet.net]) : null;

                    break;
                case 'srcToken':
                case 'dstToken':
                    if (!id) break;
                    const tokenNet = getChainByChainId(ecosystem as Ecosystems, chain as string);
                    const token = (await getTokenById(tokenNet as any, id as any)) as IAsset;

                    const target = field === 'srcToken' ? 'from' : 'to';
                    const params = token;

                    amount && (params.amount = amount);

                    // const fromToToken = operationsFactory.value?.getOperationById(targetOpId)?.getToken(target);
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: params }));

                    // * If the token is already set, no need to set it again
                    // if (fromToToken && fromToToken?.id) break;

                    // * If the token is not set, set it
                    operationsFactory.value?.getOperationById(targetOpId)?.setToken(target, params);

                    break;
                case 'receiverAddress':
                    operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('receiverAddress', address);
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: address }));
                    break;
                case 'contractAddress':
                    operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('contract', address);
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: address }));
                    break;
                case 'memo':
                    operationsFactory.value?.getOperationById(targetOpId)?.setParamByField('memo', memo);
                    isUpdateInStore && (await store.dispatch(`tokenOps/setFieldValue`, { field, value: memo }));
                    break;
            }
        }
    };

    // ****************************************************************************************************
    // * Perform the fields
    // ****************************************************************************************************
    const performFields = async (
        moduleType: string,
        params: IOperationParam[],
        { isUpdateInStore = false, id: targetOpId }: { isUpdateInStore: boolean; id: string },
    ) => {
        performDisabledOrHiddenFields(targetOpId, moduleType, params);
        await performDefaultValues(params, { targetOpId, isUpdateInStore });
    };

    // ====================================================================================================
    // * Call the on watch on mounted
    // ====================================================================================================
    const callOnWatchOnMounted = async () => {
        if (!currentOp.value) return;

        await store.dispatch('tokenOps/resetFields');

        await performFields(currentOp.value.moduleType, currentOp.value.params, {
            isUpdateInStore: true,
            id: currentOp.value.id,
        });
    };

    const callEstimate = async () => {
        if (isQuoteLoading.value || isTransactionSigning.value) return;

        const isMinAmountAccepted = checkMinAmount();

        if (store.getters['tokenOps/srcAmount'] === null) return;

        if (!isMinAmountAccepted) {
            console.log('MIN AMOUNT NOT ACCEPTED', quoteErrorMessage.value);
            return (isQuoteLoading.value = false);
        }

        try {
            isQuoteLoading.value = true;
            quoteErrorMessage.value = '';
            await operationsFactory.value.estimateOutput(store);
        } catch (error) {
            const { message = 'Error in evaluating output data' } = error || ({} as any);
            quoteErrorMessage.value = message;
        } finally {
            const flow = operationsFactory.value.getFullOperationFlow();

            const withoutApprove = flow.filter((op) => op.type !== TRANSACTION_TYPES.APPROVE);

            for (const op of withoutApprove) {
                const { moduleIndex, operationId } = op || {};

                const operation = operationsFactory.value.getOperationByKey(moduleIndex);

                if (!operationId) continue;

                if (!operation) continue;

                const shortcutOpInfo = store.getters['shortcuts/getShortcutOpInfoById'](CurrentShortcut.id, operationId);
                const { isNeedFromAmount = true } = shortcutOpInfo || {};
                const fromAmount = operation.getParamByField('amount');

                if (isNeedFromAmount && (!fromAmount || isFinite(fromAmount) || fromAmount <= 0) && !quoteErrorMessage.value)
                    quoteErrorMessage.value = 'Please Fill all from token amounts';
            }

            if (currentOp.value?.id) {
                const outputAmount = operationsFactory.value.getOperationById(currentOp.value.id)?.getParamByField('outputAmount');
                if (outputAmount && outputAmount > 0) store.dispatch(`tokenOps/setFieldValue`, { field: 'dstAmount', value: outputAmount });
            }

            isQuoteLoading.value = false;
        }
    };

    // ====================================================================================================
    // * Set the shortcut when the component is mounted
    // * Perform the shortcut when the component is mounted
    // ====================================================================================================
    const initShortcut = async () => {
        if (isConfigLoading.value) {
            console.warn('Config is loading');
            return;
        }

        if (!CurrentShortcut.id) {
            console.warn('No shortcut id found');
            return;
        }

        await store.dispatch('shortcuts/setShortcut', {
            shortcut: CurrentShortcut.id,
            data: CurrentShortcut,
        });

        const [firstOp] = CurrentShortcut.operations;

        const { layoutComponent } = firstOp as IShortcutOp;

        if (layoutComponent)
            store.dispatch('shortcuts/setCurrentLayout', {
                layout: layoutComponent,
            });

        store.dispatch('shortcuts/setCurrentShortcutId', {
            shortcutId: CurrentShortcut.id,
        });

        // ====================================================================================================
        // Set the operations factory to the store
        // ====================================================================================================
        await store.dispatch('shortcuts/setShortcutOpsFactory', {
            shortcutId: CurrentShortcut.id,
            operations: new OperationsFactory(),
        });

        shortcutIndex.value = 0;

        if (CurrentShortcut?.isComingSoon) isShortcutLoading.value = false;
        else isShortcutLoading.value = true;

        await performShortcut(true, true);

        const [order] = operationsFactory.value.getOperationOrder() || [];

        const stepId = operationsFactory.value.getOperationIdByKey(order);

        if (!stepId) {
            isShortcutLoading.value = false;
            return router.push('/shortcuts');
        }

        store.dispatch('shortcuts/setCurrentStepId', {
            stepId,
            shortcutId: CurrentShortcut.id,
        });

        store.dispatch('shortcuts/setShortcutStatus', {
            shortcutId: CurrentShortcut.id,
            status: SHORTCUT_STATUSES.PENDING,
        });

        if (currentOp.value?.id) {
            const serviceId = operationsFactory.value.getOperationById(currentOp.value.id)?.getParamByField('serviceId');

            serviceId &&
                store.dispatch('tokenOps/setServiceId', {
                    value: serviceId,
                    module: ModuleType.shortcut,
                });
        }

        isShortcutLoading.value = false;
    };

    const initDisabledOrHiddenFields = () => {
        const { moduleType, params } = currentOp.value || {};

        performDisabledOrHiddenFields(currentStepId.value, moduleType, params);
    };

    const setOperationAccount = (stepId: string, { force = false }: { force?: boolean } = {}) => {
        const operationById = operationsFactory.value.getOperationById(stepId);
        const operationByKey = operationsFactory.value.getOperationByKey(stepId);

        const operation = operationById || operationByKey;

        if (!operation) {
            console.warn('Operation not found with id:', stepId);
            return;
        }

        const { net, fromNet } = operation.getParams();

        if (!net && !fromNet) {
            console.warn('No network found for operation:', stepId);
            return;
        }

        const network = net || fromNet;

        if (force) return operation.setAccount(addressesByChain.value[network]);

        if (!operation.getAccount()) {
            console.log('ACCOUNT NOT SET', stepId, network, addressesByChain.value[network]);
            return operation.setAccount(addressesByChain.value[network]);
        }
    };

    // ----------------------------------------------------------------------------------------------------
    // ************************************************************************************************** |
    // ************************************* ON MOUNTED ************************************************* |
    // ************************************************************************************************** |
    // ----------------------------------------------------------------------------------------------------

    onMounted(async () => await initShortcut());

    // ----------------------------------------------------------------------------------------------------
    // ************************************************************************************************** |
    // ************************************ ON UNMOUNTED ************************************************ |
    // ************************************************************************************************** |
    // ----------------------------------------------------------------------------------------------------

    onUnmounted(() => {
        quoteErrorMessage.value = '';

        const { moduleType } = currentOp.value || {};

        store.dispatch('moduleStates/resetModuleStates', { module: moduleType });

        store.dispatch('tokenOps/setServiceId', {
            value: null,
            module: ModuleType.shortcut,
        });

        store.dispatch('shortcuts/resetAllShortcuts');
    });

    // ----------------------------------------------------------------------------------------------------
    // ************************************************************************************************** |
    // ************************************** WATCHERS ************************************************** |
    // ************************************************************************************************** |
    // ----------------------------------------------------------------------------------------------------

    // ====================================================================================================
    // * Watch for changes in the wallet account and update the operation account
    // ====================================================================================================

    watch(walletAccount, async (account, oldAccount) => {
        if (account === oldAccount) return;
        if (!operationsFactory.value) return;

        await delay(100);
        operationsFactory.value.getOperationOrder().forEach((id) => setOperationAccount(id, { force: true }));

        for (const operation of CurrentShortcut.operations)
            await performFields(operation.moduleType, operation.params, {
                isUpdateInStore: false,
                id: operation.id,
            });
    });

    // ====================================================================================================
    // * Watch for changes in the addressesByChain, and update the ownerAddresses field in the operations
    // ====================================================================================================
    watch(
        () => addressesByChain.value,
        (addresses, oldAddresses) => {
            setTimeout(() => initDisabledOrHiddenFields());

            if (isEqual(addresses, oldAddresses)) return console.warn('NO CHANGE IN ADDRESSES BY CHAIN');

            console.warn('ADDRESSES BY CHAIN CHANGED', addresses);

            for (const id of opIds.value) {
                const operation = operationsFactory.value.getOperationById(id) as IBaseOperation;
                operation.setParamByField('ownerAddresses', addressesByChain.value);
            }
        },
    );

    // ====================================================================================================
    // * Loaders and config
    // ====================================================================================================

    watch(isConfigLoading, async () => await initShortcut());

    watch(isConnecting, async (isConnect) => {
        initDisabledOrHiddenFields();
        if (!isConnect) await performShortcut(false, false);
    });

    watch(connectedWallets, async (wallets, oldWallets) => {
        initDisabledOrHiddenFields();
        if (isEqual(wallets, oldWallets)) return console.warn('NO CHANGE IN CONNECTED WALLETS');
        if (wallets.length > 0) await performShortcut(false, false);
    });

    watch(isQuoteLoading, (loading, oldLoading) => {
        const callInitDisabledOrHiddenFields = () => setTimeout(() => initDisabledOrHiddenFields());

        if (loading === oldLoading) return;

        if (!currentOp.value?.id) return;

        if (loading) return;

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);

        if (!operation) return;

        const quoteRoute = operation.getQuoteRoute();

        if (!quoteRoute) return callInitDisabledOrHiddenFields();

        if (!operation.getServiceType) return callInitDisabledOrHiddenFields();

        store.dispatch('bridgeDexAPI/setSelectedRoute', {
            serviceType: operation.getServiceType(),
            value: quoteRoute,
        });

        store.dispatch('bridgeDexAPI/setQuoteRoutes', {
            serviceType: operation.getServiceType(),
            value: [quoteRoute],
        });

        callInitDisabledOrHiddenFields();
    });

    watch(isCallEstimate, async (estimate, oldEstimate) => {
        if (estimate === oldEstimate) return;

        if (isCallEstimate.value) {
            await callEstimate();
            isCallEstimate.value = false;
        }
    });

    // ====================================================================================================
    // * Watch for changes in the current operation, and call the on watch on mounted
    // ====================================================================================================

    store.watch(
        (state, getters) => getters['shortcuts/getCurrentOperation'](CurrentShortcut.id, currentStepId.value),
        async () => await callOnWatchOnMounted(),
    );

    store.watch(
        (getters) => getters['shortcuts/getCurrentStepId'],
        async (stepId) => {
            if (!stepId) return;
            setOperationAccount(stepId);
        },
    );

    store.watch(
        (state, getters) => getters['tokens/getTokensListForChain'](currentChainInfo.value?.chain, { account: walletAccount.value }),
        async () => {
            for (const operation of CurrentShortcut.operations)
                await performFields(operation.moduleType, operation.params, {
                    isUpdateInStore: false,
                    id: operation.id,
                });
        },
    );

    // ====================================================================================================
    // * Watch for changes in the srcAmount, and make an estimate output request
    // ====================================================================================================
    store.watch(
        (state, getters) => getters['tokenOps/srcAmount'],

        async (srcAmount, oldAmount) => {
            // ! if config is loading, return
            if (isConfigLoading.value) return;

            // ! if no operation found, return
            if (!currentOp.value?.id) return;

            if (isEqual(srcAmount, oldAmount)) return;

            if (srcAmount) {
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('amount', srcAmount);
                await callEstimate();
            }
        },
    );

    // ====================================================================================================
    // * Watch for changes in the dstAmount
    // ====================================================================================================
    store.watch(
        (state, getters) => getters['tokenOps/dstAmount'],

        async (dstAmount, oldAmount) => {
            // ! if config is loading, return
            if (isConfigLoading.value) return;

            // ! if no operation found, return
            if (!currentOp.value?.id) return;

            if (isEqual(dstAmount, oldAmount)) return;

            if (dstAmount && (dstAmount !== null || dstAmount !== undefined))
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('outputAmount', dstAmount);
        },
    );

    // Helper function to set token parameters
    const setTokenParams = (operation: IBaseOperation | null, type: 'from' | 'to', token: IAsset) => {
        if (!token?.id || CurrentShortcut.isComingSoon) return;

        operation?.setParamByField(`${type}Token`, token.address);
        operation?.setToken(type, token);
    };

    // ====================================================================================================
    // * Watch for changes in the SRC: Network, Token | DST: Network, Token to update the operation fields
    // ====================================================================================================
    store.watch(
        (state, getters) => [
            getters['tokenOps/srcNetwork'],
            getters['tokenOps/srcToken'],
            getters['tokenOps/dstNetwork'],
            getters['tokenOps/dstToken'],
        ],
        async ([srcNet, srcToken, dstNet, dstToken], [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken]) => {
            // if config is loading or no operation found, return
            if (isConfigLoading.value || !currentOp.value?.id) return;

            const operation = operationsFactory.value.getOperationById(currentOp.value.id);

            // Update srcNet if necessary
            if (oldSrcNet?.net !== srcNet?.net && srcNet?.net) {
                operation?.setEcosystem(srcNet.ecosystem);
                operation?.setChainId(srcNet.chain_id || srcNet.net);
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
                !dstTokenField?.value
            )
                setTokenParams(operation, 'to', dstToken);
        },
    );

    // ====================================================================================================
    // * Watch for changes in the SRC: Network, Token | DST: Network, Token and call the estimate output
    // ====================================================================================================
    store.watch(
        (state, getters) => [
            getters['tokenOps/srcNetwork'],
            getters['tokenOps/srcToken'],
            getters['tokenOps/dstNetwork'],
            getters['tokenOps/dstToken'],
        ],
        async ([srcNet, srcToken, dstNetwork, dstToken], [oldSrcNet, oldSrcToken, oldDstNet, oldDstToken]) => {
            // ! if config is loading, return
            if (isConfigLoading.value) return;

            // ! if no operation found, return
            if (!currentOp.value?.id) return;

            // ! if no srcNet, srcToken, srcAmount found, return
            if (
                isEqual(
                    [srcNet?.net, srcToken?.id, dstNetwork?.net, dstToken?.id],
                    [oldSrcNet?.net, oldSrcToken?.id, oldDstNet?.net, oldDstToken?.id],
                )
            )
                return;

            // * Call the estimate output if the srcNet, srcToken
            if (srcNet?.net && srcToken?.id) await callEstimate();
        },
    );

    // ====================================================================================================
    // * Watch for changes in contractAddress, contractCallCount, dstAmount
    // ====================================================================================================

    store.watch(
        (state, getters) => [getters['tokenOps/contractAddress'], getters['tokenOps/contractCallCount']],
        async ([contractAddress, contractCallCount], [oldContractAddress, oldContractCallCount]) => {
            // ! if no operation found, return
            if (!currentOp.value?.id) return;

            // ! if no changes in contractAddress, contractCallCount, dstAmount, return
            if (isEqual([contractAddress, contractCallCount], [oldContractAddress, oldContractCallCount])) return;

            // * Set the contractAddress in the operation if the contractAddress is exist and not equal to the oldContractAddress
            if (oldContractAddress !== contractAddress)
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('contract', contractAddress);

            // * Set the contractCallCount in the operation if the contractCallCount is exist and not equal to the oldContractCallCount
            if (oldContractCallCount !== contractCallCount)
                operationsFactory.value.getOperationById(currentOp.value.id)?.setParamByField('count', contractCallCount);
        },
    );

    return {
        shortcut: CurrentShortcut,
        shortcutId: CurrentShortcut.id,
        isShortcutLoading,
        shortcutIndex,
        shortcutLayout,
        shortcutStatus,
        steps,
        currentStepId,
        operationsFactory,
    };
};

export default useShortcuts;
