import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, onUnmounted } from 'vue';
import { useStore, Store } from 'vuex';
import { startsWith, debounce } from 'lodash';

import BigNumber from 'bignumber.js';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useBridgeDexService from '@/modules/bridge-dex/compositions';
import useChainTokenManger from './useChainTokenManager';

import { IChainInfo } from '@/core/wallet-adapter/models/ecosystem-adapter';
import { useRoute } from 'vue-router';
import { RemoveLiquidityPoolId } from '@/core/shortcuts/core/';

export default function useModule(moduleType: ModuleType, { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null }) {
    const store = process.env.NODE_ENV === 'test' ? (tmpStore as Store<any>) : useStore();
    const pathRoute = useRoute();

    useChainTokenManger(moduleType, { tmpStore: store });

    const selectedSrcNetwork = computed({
        get: (): IChainInfo => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
    });

    const isTransactionSigning = computed({
        get: () => store.getters['txManager/isTransactionSigning'],
        set: (value) => store.dispatch('txManager/setTransactionSigning', value),
    });

    // =================================================================================================================
    // * Bridge Dex Service Composition
    // =================================================================================================================
    const {
        isAllowanceLoading,
        isNeedApprove,
        isQuoteLoading,
        quoteErrorMessage,
        fees,

        selectedRoute,
        quoteRoutes,
        otherRoutes,

        isShowEstimateInfo,

        makeApproveRequest,
        makeSwapRequest,
        makeAllowanceRequest,
        clearAllowance,
        resetQuoteRoutes,
    } = useBridgeDexService(moduleType, { tmpStore: store });

    // =================================================================================================================

    const selectedService = computed({
        get: () => store.getters[`tokenOps/selectedService`],
        set: (value) => store.dispatch(`tokenOps/setSelectedService`, value),
    });

    const routeTimer = computed<{
        seconds: number;
        percent: number;
    }>(() => store.getters['bridgeDexAPI/getRouteTimerSeconds'](selectedRoute.value?.routeId));

    const isConfigsLoading = computed(() => store.getters['configs/isConfigLoading']);

    const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](moduleType));

    // =================================================================================================================

    // * Operation title for module
    const DEFAULT_TITLE = `tokenOperations.${moduleType === 'swap' ? 'swap' : 'confirm'}`;
    const opTitle = ref(DEFAULT_TITLE);

    // * Errors
    const txError = ref('');
    const txErrorTitle = ref('Transaction error');

    const module = ref('');

    // =================================================================================================================

    const { walletAccount, currentChainInfo, chainList } = useAdapter({ tmpStore: store });

    // =================================================================================================================

    const selectType = computed({
        get: () => store.getters['tokenOps/selectType'],
        set: (value) => store.dispatch('tokenOps/setSelectType', value),
    });

    const isInput = computed({
        get: () => store.getters['tokenOps/isInput'],
        set: (value) => store.dispatch('tokenOps/setIsInput', value),
    });

    // =================================================================================================================

    const selectedSrcToken = computed({
        get: () => store.getters['tokenOps/srcToken'],
        set: (value) => store.dispatch('tokenOps/setSrcToken', value),
    });

    const selectedDstToken = computed({
        get: () => store.getters['tokenOps/dstToken'],
        set: (value) => store.dispatch('tokenOps/setDstToken', value),
    });

    const selectedDstNetwork = computed({
        get: (): IChainInfo => store.getters['tokenOps/dstNetwork'],
        set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
    });

    // =================================================================================================================

    const targetDirection = computed({
        get: () => store.getters['tokenOps/direction'],
        set: (value) => store.dispatch('tokenOps/setDirection', value),
    });

    const onlyWithBalance = computed({
        get: () => store.getters['tokenOps/onlyWithBalance'],
        set: (value) => store.dispatch('tokenOps/setOnlyWithBalance', value),
    });

    // =================================================================================================================

    const receiverAddress = computed({
        get: () => store.getters['tokenOps/receiverAddress'],
        set: (value) => store.dispatch('tokenOps/setReceiverAddress', value),
    });

    const contractAddress = computed({
        get: () => store.getters['tokenOps/contractAddress'],
        set: (value) => store.dispatch('tokenOps/setContractAddress', value),
    });

    const contractCallCount = computed({
        get: () => store.getters['tokenOps/contractCallCount'],
        set: (value) => store.dispatch('tokenOps/setContractCallCount', value),
    });

    const slippage = computed({
        get: () => store.getters['tokenOps/slippage'],
        set: (value) => store.dispatch('tokenOps/setSlippage', value),
    });

    // =================================================================================================================

    const isSendToAnotherAddress = ref(false);
    const isAddressError = ref(false);

    // =================================================================================================================

    const srcAmount = computed({
        get: () => store.getters['tokenOps/srcAmount'],
        set: (value) => store.dispatch('tokenOps/setSrcAmount', value),
    });

    const dstAmount = computed({
        get: () => store.getters['tokenOps/dstAmount'],
        set: (value) => store.dispatch('tokenOps/setDstAmount', value),
    });

    // =================================================================================================================

    const isMemoAllowed = computed(() => selectedSrcNetwork.value?.ecosystem === Ecosystem.COSMOS);
    const isSendWithMemo = ref(false);

    const memo = computed({
        get: () => store.getters['tokenOps/memo'],
        set: (value) => store.dispatch('tokenOps/setMemo', value),
    });

    // =================================================================================================================

    const isNeedInputFocus = computed({
        get: () => store.getters['moduleStates/getIsNeedInputFocus'],
        set: (value) => store.dispatch('moduleStates/setIsNeedInputFocus', value),
    });

    // =================================================================================================================

    const CurrentShortcut = computed(() => store.getters['shortcuts/getCurrentShortcutId']);

    const isNeedAddLpApprove = computed({
        get: () => store.getters['portalFi/isNeedApproveLP'],
        set: (value) => store.dispatch('portalFi/setIsNeedApproveLP', value),
    });

    const isNeedRemoveLpApprove = computed({
        get: () => store.getters['portalFi/isNeedRemoveLpApprove'],
        set: (value) => store.dispatch('portalFi/setIsNeedRemoveLPApprove', value),
    });
    // =================================================================================================================

    const estimateErrorTitle = ref('');
    const isBalanceError = computed(() => BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance) || false);

    const isLoading = ref(false);
    const isEstimating = ref(false);

    const isDirectionSwapped = ref(false);

    const isSwapDirectionAvailable = computed(() => {
        if (!selectedSrcToken.value || !selectedDstToken.value) return false;

        return true;
    });

    // =================================================================================================================

    // const isAllTokensLoading = computed(() => store.getters['tokens/loader']);
    const isTokensLoadingForSrc = computed(() =>
        store.getters['tokens/loadingByChain'](walletAccount.value, selectedSrcNetwork.value?.net),
    );

    const isTokensLoadingForDst = computed(() =>
        store.getters['tokens/loadingByChain'](walletAccount.value, selectedDstNetwork.value?.net),
    );

    // =================================================================================================================

    const inputFocus = () => {
        const input = document.querySelector('input.input-balance');

        if (input && input instanceof HTMLInputElement && isNeedInputFocus.value) input.focus();
    };

    const checkSelectedNetwork = (): string => {
        const isSameWithCurrent = currentChainInfo.value && currentChainInfo.value?.net === selectedSrcNetwork.value?.net;

        // 1. If wallet account is not connected
        if (!walletAccount.value && !currentChainInfo.value) return 'tokenOperations.connectWallet';
        // 2. If selected token need approve
        if (isNeedApprove.value) return 'tokenOperations.approve';
        // 3. If selected network is same with current
        else if (isSameWithCurrent) return DEFAULT_TITLE;
        // 4. If selected network is not same with current
        return DEFAULT_TITLE;
    };

    const handleOnSwapDirections = async (withChains = false) => {
        isDirectionSwapped.value = true;

        if (withChains) {
            const from = JSON.parse(JSON.stringify(selectedSrcNetwork.value));
            const to = JSON.parse(JSON.stringify(selectedDstNetwork.value));

            [selectedSrcNetwork.value, selectedDstNetwork.value] = [to, from];
        }

        const fromToken = JSON.parse(JSON.stringify(selectedSrcToken.value));
        const toToken = JSON.parse(JSON.stringify(selectedDstToken.value));

        [selectedSrcToken.value, selectedDstToken.value] = [toToken, fromToken];

        resetQuoteRoutes();

        debounce(() => (isDirectionSwapped.value = false), 1500)();
    };

    // =================================================================================================================

    // * Select Network and Token Modals

    const openSelectModal = (selectFor: any, { direction, type }: any) => {
        direction && (targetDirection.value = direction);
        type && (selectType.value = type);

        return store.dispatch('app/toggleSelectModal', { type: selectFor, module: moduleType });
    };

    const handleOnSelectNetwork = ({ direction, type }: any) => {
        return openSelectModal('network', { direction, type });
    };

    const handleOnSelectToken = ({ direction, type }: any) => {
        return openSelectModal('token', { direction, type });
    };

    const handleOnSelectPool = ({ direction, type }: any) => {
        return openSelectModal('pool', { direction, type });
    };

    const handleOnSetAmount = (amount: string | number) => {
        if (srcAmount.value === amount) return;

        if (amount && startsWith(amount.toString(), '.') && amount.toString().length > 1) return (srcAmount.value = `0${amount}`);

        srcAmount.value = amount;
    };

    const toggleRoutesModal = () => store.dispatch('app/toggleModal', 'routesModal');

    const callOnMounted = () => {
        const isAccountAuth = walletAccount.value && currentChainInfo.value;

        const currentChain = store.getters['configs/getChainConfigByChainId'](currentChainInfo.value?.chain, Ecosystem.EVM);

        if (isAccountAuth && !selectedSrcNetwork.value?.net && Object.keys(currentChain).length)
            selectedSrcNetwork.value = currentChainInfo.value as IChainInfo;
        else if (!selectedSrcNetwork.value?.net && chainList.value?.length) selectedSrcNetwork.value = chainList.value[0];
    };

    const getEstimateInfo = async (isReload = false) => {
        if (isReload && (isQuoteLoading.value || isTransactionSigning.value)) return;

        if (dstAmount.value && isReload) dstAmount.value = '';

        store.dispatch('bridgeDexAPI/setReloadRoutes', isReload);
    };

    const clearRouteTimer = async () => {
        store.dispatch('bridgeDexAPI/clearRouteTimer', {
            routeId: selectedRoute.value?.routeId,
        });

        // * if tab is active then it will get new estimate info
        if (!document.hidden) {
            resetQuoteRoutes();
            return await getEstimateInfo(true);
        }

        // ! If tab is not active then it will not get new estimate info
        return console.warn('Route timer is cleared');
    };

    onMounted(() => {
        module.value = moduleType;
        isNeedAddLpApprove.value = false;
        isNeedRemoveLpApprove.value = false;

        opTitle.value = checkSelectedNetwork();
    });

    const unWatchIsNeedApprove = watch(isNeedApprove, () => {
        if (isNeedApprove.value) return (opTitle.value = 'tokenOperations.approve');
        opTitle.value = DEFAULT_TITLE;
    });

    const unWatchIsNeedAddLp = watch(isNeedAddLpApprove, () => {
        if (isNeedAddLpApprove.value) return (opTitle.value = 'tokenOperations.approve');
        opTitle.value = DEFAULT_TITLE;
    });

    const unWatchIsNeedRemove = watch(isNeedRemoveLpApprove, () => {
        if (CurrentShortcut.value !== RemoveLiquidityPoolId) return;
        if (isNeedRemoveLpApprove.value) return (opTitle.value = 'tokenOperations.approve');
        opTitle.value = DEFAULT_TITLE;
    });

    const unWatchWalletAccount = watch(walletAccount, () => (opTitle.value = checkSelectedNetwork()));

    const unWatchSelectedRoute = watch(selectedRoute, () => {
        if (pathRoute.path.startsWith('/shortcuts')) return;
        if (selectedRoute.value && selectedRoute.value?.toAmount) dstAmount.value = selectedRoute.value.toAmount;
    });

    const unWatchIsQuote = watch(isQuoteLoading, () => {
        if (!isQuoteLoading.value) nextTick(() => inputFocus());
    });

    const unWatchIsConfig = watch([isConfigsLoading, module], () => callOnMounted());

    const unWatchRouteTime = watch(
        () => routeTimer.value.seconds,
        async () => {
            if (pathRoute.path.startsWith('/shortcuts')) return;
            if (routeTimer.value.seconds === 0) await clearRouteTimer();
        },
    );

    onBeforeUnmount(() => {
        // Clear all data
        store.dispatch('tokenOps/resetFields');
        opTitle.value = checkSelectedNetwork();
    });

    onUnmounted(() => {
        unWatchIsNeedApprove();
        unWatchIsNeedAddLp();
        unWatchIsNeedRemove();
        unWatchWalletAccount();
        unWatchSelectedRoute();
        unWatchIsQuote();
        unWatchIsConfig();
        unWatchRouteTime();
    });

    return {
        // Main information for operation
        selectedService,

        selectedSrcToken,
        selectedDstToken,
        selectedSrcNetwork,
        selectedDstNetwork,

        selectType,
        targetDirection,
        onlyWithBalance,

        isSwapDirectionAvailable,
        isDirectionSwapped,

        // Receiver
        isSendToAnotherAddress,
        isAddressError,
        receiverAddress,

        contractAddress,
        contractCallCount,

        // Amounts
        srcAmount,
        dstAmount,

        // Memo
        isMemoAllowed,
        isSendWithMemo,
        memo,

        // Slippage tolerance
        slippage,

        // Operation title
        opTitle,

        isShowEstimateInfo,

        // Errors
        isInput,
        txError,
        txErrorTitle,
        isBalanceError,
        estimateErrorTitle,

        // Loaders
        isEstimating,
        isLoading,
        isTokensLoadingForSrc,
        isTokensLoadingForDst,
        isWaitingTxStatusForModule,

        // Flags
        isNeedInputFocus,

        // Functions
        openSelectModal,
        toggleRoutesModal,

        handleOnSelectToken,
        handleOnSelectNetwork,
        handleOnSelectPool,

        handleOnSetAmount,

        // setTokenOnChange,
        checkSelectedNetwork,
        handleOnSwapDirections,
        getEstimateInfo,

        // Bridge Dex
        isAllowanceLoading,
        isNeedApprove,
        isNeedAddLpApprove,
        isNeedRemoveLpApprove,
        isQuoteLoading,
        quoteErrorMessage,
        quoteRoutes,
        otherRoutes,
        fees,
        selectedRoute,
        routeTimer,

        makeApproveRequest,
        makeSwapRequest,
        makeAllowanceRequest,
        clearAllowance,

        // Fields
        fieldStates: computed(() => store.getters['moduleStates/getFieldsForModule'](moduleType)),
    };
}
