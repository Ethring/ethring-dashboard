import { isEqual } from 'lodash';
import { StepProps } from 'ant-design-vue';

// ********************* Vue/Vuex *********************
import { computed, onBeforeUnmount, onMounted, onUnmounted, watch } from 'vue';
import { useStore, Store } from 'vuex';

// ********************* Compositions *********************
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useShortcutOperations from '@/core/shortcuts/compositions/useShortcutOperations';
import usePrepareFields from '@/core/shortcuts/compositions/usePrepareFields';

// ********************* Shortcuts *********************
import ShortcutCl, { IShortcutData } from '@/core/shortcuts/core/Shortcut';
import { IShortcutOp } from '@/core/shortcuts/core/ShortcutOp';

// ********************* Shared Models *********************
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { IConnectedWallet } from '@/shared/models/types/Account';
import { SHORTCUT_STATUSES } from '@/shared/models/enums/statuses.enum';
import { delay } from '@/shared/utils/helpers';
import { IAsset } from '@/shared/models/fields/module-fields';

const useShortcuts = (Shortcut: IShortcutData, { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null }) => {
    if (!Shortcut) {
        console.error('Shortcut data is required');
        throw new Error('Shortcut data is required');
    }

    if (!Shortcut?.id) {
        console.error('Shortcut id is required');
        throw new Error('Shortcut id is required');
    }

    // Create a new instance of the Shortcut class
    const shortcut = new ShortcutCl(Shortcut);

    // ****************************************************************************************************
    // * Main store and router
    // ****************************************************************************************************

    const store = tmpStore || useStore();

    // ****************************************************************************************************
    // * Wallet adapter and tokens list
    // ****************************************************************************************************

    const { isConnecting, connectedWallets, walletAccount, currentChainInfo } = useAdapter({
        tmpStore: store,
    });

    const {
        addressesByChain,

        initOperationsFactory,

        operationsFactory,
        firstOperation,
        lastOperation,

        processShortcutOperation,
        setOperationAccount,
    } = useShortcutOperations(shortcut.id, { tmpStore: store });

    const { callPerformOnWatchOnMounted, performFields, performDisabledOrHiddenFields } = usePrepareFields(shortcut.id, addressesByChain, {
        tmpStore: store,
    });

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

    // * Quote loading state from the store
    const isQuoteLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('quote'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value }),
    });

    // * Shortcut index from the store
    const shortcutIndex = computed({
        get: () => store.getters['shortcuts/getShortcutIndex'],
        set: (value) => store.dispatch('shortcuts/setShortcutIndex', { index: value }),
    });

    // * Config loading state from the store
    const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

    // ****************************************************************************************************
    // * Current shortcut properties
    // ****************************************************************************************************

    // * Get the current operation from the store

    const currentStepId = computed(() => store.getters['shortcuts/getCurrentStepId']);
    const currentOp = computed<IShortcutOp>(() => {
        if (!shortcut.id || !currentStepId.value) return null;
        return store.getters['shortcuts/getCurrentOperation'](shortcut.id);
    });

    const shortcutLayout = computed(() => store.getters['shortcuts/getCurrentLayout']);
    const shortcutStatus = computed(() => store.getters['shortcuts/getShortcutStatus'](shortcut.id));
    const steps = computed<StepProps[]>(() => store.getters['shortcuts/getShortcutSteps'](shortcut.id));

    // ****************************************************************************************************
    // * Perform the shortcut operations
    // ****************************************************************************************************

    const performShortcut = async (addToFactory = false, isUpdateInStore = false, from: string): Promise<boolean> => {
        if (!operationsFactory.value) {
            console.warn('No operations factory found');
            return false;
        }

        const { operations = [] } = shortcut || {};

        // ! if operations already exists in the factory, no need to add them again
        if (operationsFactory.value.getOperationsIds().size >= operations.length) {
            console.warn('Operations already exists');
            return false;
        }

        // * Process the operations
        for (const shortcutOperation of operations) {
            const { id: opId, dependencies: opDeps = null } = shortcutOperation as any;
            opDeps && operationsFactory.value.setDependencies(opId, opDeps);

            if (!addToFactory) continue;

            await processShortcutOperation(shortcutOperation as IShortcutOp);
        }

        const getFirstOpId = () => {
            const uniqueId = firstOperation.value?.getUniqueId();
            if (!uniqueId) return null;

            const firstOperationID = operationsFactory.value.getOperationIdByKey(uniqueId);

            if (!firstOperationID) return null;

            return firstOperationID;
        };

        await delay(500);

        for (const shortcutOperation of operations) {
            const { id: opId, moduleType, params } = shortcutOperation as any;

            const isFirstOperation = opId === getFirstOpId();

            await performFields(moduleType, params, {
                isUpdateInStore: isFirstOperation ? isUpdateInStore : false,
                id: opId,
                from: 'performShortcut -> FOR LOOP',
            });
        }

        return true;
    };

    // ====================================================================================================
    // * Set the shortcut when the component is mounted
    // * Perform the shortcut when the component is mounted
    // ====================================================================================================

    const initShortcutAndLayout = async () => {
        if (isConfigLoading.value) {
            console.warn('Config is loading');
            return false;
        }

        if (!shortcut.id) {
            console.warn('Shortcut Id not found');
            return false;
        }

        shortcutIndex.value = 0;

        const [firstOp] = shortcut.operations || [];

        if (!firstOp) {
            console.warn('No operations found');
            return false;
        }

        const { layoutComponent } = firstOp as IShortcutOp;

        if (layoutComponent)
            await store.dispatch('shortcuts/setCurrentLayout', {
                layout: layoutComponent,
            });

        await store.dispatch('shortcuts/setShortcut', {
            shortcut: shortcut.id,
            data: shortcut,
        });

        await store.dispatch('shortcuts/setShortcutStatus', {
            shortcutId: shortcut.id,
            status: SHORTCUT_STATUSES.PENDING,
        });

        await store.dispatch('shortcuts/setCurrentShortcutId', {
            shortcutId: shortcut.id,
        });

        return true;
    };

    const initShortcutSteps = async () => {
        if (!shortcut) {
            console.warn('Shortcut not found');
            return false;
        }

        if (!shortcut.id) {
            console.warn('Shortcut Id not found');
            return false;
        }

        const { operations = [] } = shortcut || {};

        if (!operations || !operations.length) {
            console.warn('No operations found for the shortcut');
            return false;
        }

        const [firstOp] = operations || [];

        await store.dispatch('shortcuts/setCurrentStepId', {
            stepId: firstOp.id,
            shortcutId: shortcut.id,
        });

        return true;
    };

    const initShortcutService = async () => {
        if (!shortcut.operations.length) {
            console.warn('No operations found');
            return false;
        }

        if (!operationsFactory.value) {
            console.warn('No operations factory found');
            return false;
        }

        if (!currentOp.value) {
            console.warn('No current operation found');
            return false;
        }

        if (!currentOp.value.id) {
            console.warn('No current operation id found');
            return false;
        }

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);

        if (!operation) {
            console.warn(`No operation with id: ${currentOp.value.id} found`);
            return false;
        }

        const serviceId = operation.getParamByField('serviceId');

        if (!serviceId) {
            console.warn('No service id found');
            return false;
        }

        await store.dispatch('tokenOps/setServiceId', {
            value: serviceId,
            module: ModuleType.shortcut,
        });
    };

    const initDisabledOrHiddenFields = () => {
        const { moduleType, params } = currentOp.value || {};
        performDisabledOrHiddenFields(currentStepId.value, moduleType, params);
    };

    // ****************************************************************************************************
    // * Initializations
    // ****************************************************************************************************

    const initializations = async () => {
        isShortcutLoading.value = true;
        await initShortcutAndLayout();
        await initOperationsFactory();
        await initShortcutSteps();
        await performShortcut(true, true, 'initializations');
        await initShortcutService();
        await delay(400);
        isShortcutLoading.value = false;
    };

    // ****************************************************************************************************
    // ******************************** WATCHER'S HANDLERS ************************************************
    // ****************************************************************************************************

    const handleOnChangeTokensList = async (tokenList: IAsset[], oldTokenList: IAsset[]) => {
        if (!operationsFactory.value) return false;
        if (!shortcut || !shortcut.operations) return false;
        if (!shortcut.operations.length) return false;
        if (isEqual(tokenList, oldTokenList)) return false;

        // * Set the token list for the operations
        for (const operation of shortcut.operations)
            await performFields(operation.moduleType, operation.params, {
                isUpdateInStore: false,
                id: operation.id,
                from: 'handleOnChangeTokensList',
            });

        return true;
    };

    const handleOnChangeIsConfigLoading = async (loading: boolean, oldLoading: boolean) => {
        if (loading === oldLoading) return false;
        if (loading) return false;
        await initializations();
        return true;
    };

    const handleOnChangeWalletAccount = async (account: string | null, oldAccount: string | null) => {
        if (account === oldAccount) return false;
        if (!operationsFactory.value) return false;

        await delay(100);

        if (!operationsFactory.value?.getOperationOrder) return false;

        const operationList = operationsFactory.value.getOperationOrder();

        if (!operationList.length) return false;

        operationList.forEach((id) => setOperationAccount(id, { force: true }));

        for (const operation of shortcut.operations) {
            const { moduleType, params } = operation;
            await performFields(moduleType, params, {
                isUpdateInStore: false,
                id: operation.id,
                from: 'handleChangeWalletAccount',
            });
        }

        return true;
    };

    const handleOnChangeIsQuoteLoading = async (loading: boolean, oldLoading: boolean) => {
        initDisabledOrHiddenFields();

        if (loading === oldLoading) return false;
        if (loading) return false;

        if (!currentOp.value?.id) return false;

        const operation = operationsFactory.value.getOperationById(currentOp.value.id);
        if (!operation) return false;

        const quoteRoute = operation.getQuoteRoute();

        if (!quoteRoute) {
            initDisabledOrHiddenFields();
            return false;
        }
        if (!operation.getServiceType) {
            initDisabledOrHiddenFields();
            return false;
        }

        await store.dispatch('bridgeDexAPI/setSelectedRoute', {
            serviceType: operation.getServiceType(),
            value: quoteRoute,
        });

        await store.dispatch('bridgeDexAPI/setQuoteRoutes', {
            serviceType: operation.getServiceType(),
            value: [quoteRoute],
        });

        initDisabledOrHiddenFields();

        return true;
    };

    const handleOnChangeIsConnecting = async (isConnect: boolean, oldIsConnect: boolean) => {
        if (isConnect === oldIsConnect) return false;

        initDisabledOrHiddenFields();
        if (!isConnect) {
            await performShortcut(false, false, 'handleOnChangeIsConnecting');
            return true;
        }

        return false;
    };

    const handleOnChangeConnectedWallets = async (wallets: IConnectedWallet[], oldWallets: IConnectedWallet[]): Promise<boolean> => {
        initDisabledOrHiddenFields();

        if (isEqual(wallets, oldWallets)) {
            console.warn('NO CHANGE IN CONNECTED WALLETS');
            return false;
        }

        if (wallets.length > 0) {
            await performShortcut(false, false, 'handleOnChangeConnectedWallets');
            return true;
        }

        return false;
    };

    // **************************************************************************************************
    // ************************************* ON MOUNTED *************************************************
    // **************************************************************************************************

    onMounted(async () => {
        if (isConfigLoading.value) return console.warn('Config is loading');
        await initializations();
    });

    // **************************************************************************************************
    // ************************************** WATCHERS **************************************************
    // **************************************************************************************************

    // * Watch for changes in the wallet account and update the operation account

    const unWatchWalletAccount = watch(walletAccount, handleOnChangeWalletAccount);
    const unWatchConfigLoading = watch(isConfigLoading, handleOnChangeIsConfigLoading);
    const unWatchIsConnecting = watch(isConnecting, handleOnChangeIsConnecting);
    const unWatchConnectedWallets = watch(connectedWallets, handleOnChangeConnectedWallets);
    const unWatchIsQuoteLoading = watch(isQuoteLoading, handleOnChangeIsQuoteLoading);

    // * Store watchers
    const unWatchCurrentOp = store.watch(
        (state, getters) => getters['shortcuts/getCurrentOperation'](shortcut.id, currentStepId.value),
        callPerformOnWatchOnMounted,
    );

    const unWatchTokenList = store.watch(
        (state, getters) => getters['tokens/getTokensListForChain'](currentChainInfo.value?.chain, { account: walletAccount.value }),
        handleOnChangeTokensList,
    );

    // **************************************************************************************************
    // ************************************ ON UNMOUNTED ************************************************
    // **************************************************************************************************

    onBeforeUnmount(async () => {
        const { moduleType } = currentOp.value || {};

        // * Unwatch the watchers
        await Promise.all([
            store.dispatch('shortcuts/resetAllShortcuts'),

            store.dispatch('moduleStates/resetModuleStates', { module: moduleType || ModuleType.shortcut }),

            store.dispatch('tokenOps/setServiceId', {
                value: null,
                module: moduleType || ModuleType.shortcut,
            }),
        ]);
    });

    onUnmounted(() => {
        quoteErrorMessage.value = '';
        unWatchIsQuoteLoading();
        unWatchIsConnecting();
        unWatchConfigLoading();
        unWatchWalletAccount();
        unWatchConnectedWallets();
        unWatchTokenList();
        unWatchCurrentOp();
    });

    return {
        shortcut,
        shortcutId: shortcut.id,
        isShortcutLoading,
        shortcutIndex,
        shortcutLayout,
        shortcutStatus,
        steps,
        currentStepId,
        operationsFactory,
        currentOp,

        initializations,
        initShortcutAndLayout,
        initShortcutService,
        initShortcutSteps,

        initDisabledOrHiddenFields,

        performShortcut,

        handleOnChangeTokensList,
        handleOnChangeWalletAccount,
        handleOnChangeConnectedWallets,

        handleOnChangeIsConnecting,
        handleOnChangeIsConfigLoading,
        handleOnChangeIsQuoteLoading,
    };
};

export default useShortcuts;
