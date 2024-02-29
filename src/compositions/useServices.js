import BigNumber from 'bignumber.js';
import _ from 'lodash';

import { ref, computed, inject, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

import { ECOSYSTEMS } from '@/Adapter/config';

import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';

import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { STATUSES } from '@/shared/constants/super-swap/constants';
import { useRouter } from 'vue-router';
import useBridgeDexService from '@/modules/bridge-dex/compositions';
import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';

export default function useModule({ moduleType }) {
    const { t } = useI18n();
    const store = useStore();

    const router = useRouter();

    const { name: module } = router.currentRoute.value;

    const selectedSrcNetwork = computed({
        get: () => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
    });

    const useAdapter = inject('useAdapter');

    // =================================================================================================================
    // * Bridge Dex Service Composition
    // =================================================================================================================
    const {
        isAllowanceLoading,
        isNeedApprove,
        isQuoteLoading,
        quoteErrorMessage,
        quoteRoutes,
        fees,
        selectedRoute,

        isRequireConnect,

        makeApproveRequest,
        makeSwapRequest,
        makeAllowanceRequest,
        clearAllowance,
    } = useBridgeDexService(moduleType);

    // =================================================================================================================

    const selectedService = computed({
        get: () => store.getters[`tokenOps/selectedService`],
        set: (value) => store.dispatch(`tokenOps/setSelectedService`, value),
    });

    const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](module));

    // * Bridge Dex
    const bridgeDexRoutes = computed(() => store.getters['bridgeDex/selectedRoute']);
    const bestRouteInfo = computed(() => bridgeDexRoutes.value?.bestRoute);
    const currentRouteInfo = computed(() => bestRouteInfo.value?.routes.find((elem) => elem.status === STATUSES.SIGNING));

    // * Notification
    const { showNotification, closeNotification } = useNotification();

    // =================================================================================================================

    // * Operation title for module
    const DEFAULT_TITLE = `tokenOperations.${moduleType === 'swap' ? 'swap' : 'confirm'}`;
    const opTitle = ref(DEFAULT_TITLE);

    // * Errors
    const txError = ref('');
    const txErrorTitle = ref('Transaction error');

    // =================================================================================================================

    const { walletAccount, walletAddress, currentChainInfo, chainList } = useAdapter();

    // =================================================================================================================

    const { getTokensList } = useTokensList();

    const tokensList = ref([]);

    // =================================================================================================================

    const selectType = computed({
        get: () => store.getters['tokenOps/selectType'],
        set: (value) => store.dispatch('tokenOps/setSelectType', value),
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
        get: () => store.getters['tokenOps/dstNetwork'],
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

    const isMemoAllowed = computed(() => selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS);
    const isSendWithMemo = ref(false);

    const memo = computed({
        get: () => store.getters['tokenOps/memo'],
        set: (value) => store.dispatch('tokenOps/setMemo', value),
    });

    // =================================================================================================================

    const estimateErrorTitle = ref('');
    const isBalanceError = computed(() => BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance) || false);

    const isLoading = ref(false);
    const isEstimating = ref(false);

    const isDirectionSwapped = ref(false);

    const isSwapDirectionAvailable = computed(() => {
        if (!selectedSrcToken.value || !selectedDstToken.value) {
            return false;
        }

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

    // =================================== FEE INFO ===================================

    const baseFeeInfo = ref({
        title: '',
        symbolBetween: '',
        fromAmount: '',
        fromSymbol: '',
        toAmount: '',
        toSymbol: '',
    });

    const rateFeeInfo = ref({
        title: '',
        symbolBetween: '',
        fromAmount: '',
        fromSymbol: '',
        toAmount: '',
        toSymbol: '',
    });

    const protocolFeeInfo = ref({
        title: '',
        symbolBetween: '',
        fromAmount: '',
        fromSymbol: '',
        toAmount: '',
        toSymbol: '',
    });

    const estimateTimeInfo = ref({
        title: '',
        symbolBetween: '',
        fromAmount: '',
        fromSymbol: '',
        toAmount: '',
        toSymbol: '',
    });

    const isShowEstimateInfo = computed(() => {
        const requiredValues = selectedSrcToken.value?.id && srcAmount.value && dstAmount.value;

        if (estimateErrorTitle.value) {
            return true;
        }

        if (!srcAmount.value || !dstAmount.value || !selectedSrcToken.value?.id) {
            return false;
        }

        if (requiredValues && moduleType !== ModuleType.send) {
            return true;
        }

        if (baseFeeInfo.value?.title || rateFeeInfo.value?.title || protocolFeeInfo.value?.title || estimateTimeInfo.value?.title) {
            return true;
        }

        return false;
    });

    // =================================================================================================================
    const setTokenOnChangeForNet = async (srcNet, srcToken, { isSameNet = false, isExclude = false, token = null } = {}) => {
        const getTokensParams = {
            srcNet,
            isSameNet,
            onlyWithBalance: selectType.value === TOKEN_SELECT_TYPES.FROM,
        };

        isExclude && (getTokensParams.dstToken = token);

        tokensList.value = await getTokensList(getTokensParams);

        const [defaultSrcToken = null] = tokensList.value;

        if (!srcToken?.id && defaultSrcToken) {
            return defaultSrcToken;
        }

        const { id: targetId } = srcToken || {};

        const searchTokens = [targetId];

        const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn?.id)) || [];

        if (!updatedList.length) {
            return defaultSrcToken;
        }

        const [tkn = null] = updatedList;

        if (!tkn) {
            return defaultSrcToken;
        }

        return tkn;
    };

    // =================================================================================================================

    const checkSelectedNetwork = () => {
        // if (!walletAccount.value && !currentChainInfo.value) {
        //     return (opTitle.value = 'tokenOperations.connectWallet');
        // }

        const isSameWithCurrent = currentChainInfo.value && currentChainInfo.value.net === selectedSrcNetwork.value?.net;

        // setEcosystemService();

        if (isNeedApprove.value) {
            return (opTitle.value = 'tokenOperations.approve');
        }

        if (isSameWithCurrent) {
            return (opTitle.value = DEFAULT_TITLE);
        }

        return (opTitle.value = DEFAULT_TITLE);
    };

    const resetTokensForModules = async (from = 'default', { isAccountChanged = false } = {}) => {
        const isSrcTokenChanged = selectedSrcToken.value && selectedSrcToken.value.chain !== selectedSrcNetwork.value?.net;
        const isDstTokenChanged = selectedDstToken.value && selectedDstToken.value.chain !== selectedDstNetwork.value?.net;

        const isDstTokenChangedForSwap = selectedDstToken.value?.chain !== selectedSrcNetwork.value?.net;

        switch (moduleType) {
            case 'swap':
                if (isSrcTokenChanged || !selectedSrcToken.value || isAccountChanged) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value, {
                        from: 'switch-swap, from',
                    });
                }

                if (isDstTokenChangedForSwap || !selectedDstToken.value || isAccountChanged) {
                    selectedDstToken.value = null;
                    // setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
                    //     from: 'switch-swap, to',
                    //     isSameNet: true,
                    //     isExclude: true,
                    //     token: selectedSrcToken.value,
                    // });
                }

                break;

            case 'send':
                selectedDstToken.value = null;

                if (isSrcTokenChanged || isAccountChanged) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value, {
                        from: 'switch-send, from',
                    });
                }

                break;

            case 'bridge':
            case 'super-swap':
                if (isSrcTokenChanged || isAccountChanged) {
                    selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value, {
                        from: 'switch-bridge, from',
                    });
                }

                if (isDstTokenChanged || isAccountChanged) {
                    selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, {
                        from: 'switch-bridge, to',
                    });
                }

                break;
        }
    };

    const swapDirections = async (withChains = false) => {
        isDirectionSwapped.value = true;

        if (withChains) {
            [selectedSrcNetwork.value, selectedDstNetwork.value] = [selectedDstNetwork.value, selectedSrcNetwork.value];
        }

        [selectedSrcToken.value, selectedDstToken.value] = [selectedDstToken.value, selectedSrcToken.value];

        _.debounce(() => (isDirectionSwapped.value = false), 1500)();
    };

    // =================================================================================================================

    // * Select Network and Token Modals

    const openSelectModal = (selectFor, { direction, type }) => {
        direction && (targetDirection.value = direction);
        type && (selectType.value = type);

        return store.dispatch('app/toggleSelectModal', { type: selectFor, module: moduleType });
    };

    const handleOnSelectNetwork = ({ direction, type }) => {
        return openSelectModal('network', { direction, type });
    };

    const handleOnSelectToken = ({ direction, type }) => {
        return openSelectModal('token', { direction, type });
    };

    // =================================================================================================================

    // * Watchers

    // ========================= Watch Chain Info =========================
    const unWatchChainInfo = watch(currentChainInfo, () => {
        if (selectedSrcNetwork.value?.ecosystem !== currentChainInfo?.value?.ecosystem) {
            selectedSrcNetwork.value = null;
            selectedDstNetwork.value = null;
        }

        if (selectedSrcNetwork.value?.net !== currentChainInfo?.value?.net) {
            selectedSrcNetwork.value = currentChainInfo.value;
        }

        if (
            ['super-swap', 'bridge'].includes(moduleType) &&
            chainList.value?.length &&
            selectedSrcNetwork.value?.net &&
            !selectedDstNetwork.value?.net
        ) {
            selectedDstNetwork.value = chainList.value?.filter(({ net }) => net !== selectedSrcNetwork.value?.net)[0];
        }
    });

    // ========================= Watch Wallet Account =========================

    const unWatchAcc = watch(walletAccount, async (newAccount, oldAccount) => {
        const isAccountChanged = newAccount !== oldAccount;
        const isAccountExist = !!newAccount;
        const isOldNotEmpty = oldAccount && oldAccount !== null;

        if (!isAccountChanged || !isAccountExist || !isOldNotEmpty) {
            return;
        }

        estimateErrorTitle.value = '';

        if (
            ['super-swap', 'bridge'].includes(moduleType) &&
            chainList.value?.length &&
            selectedSrcNetwork.value?.net &&
            !selectedDstNetwork.value?.net
        ) {
            selectedDstNetwork.value = chainList.value?.filter(({ net }) => net !== selectedSrcNetwork.value?.net)[0];
        }

        await resetTokensForModules('watch-wallet-account', { isAccountChanged });
        // setEcosystemService();
    });

    // ========================= Watch Selected SRC DST Networks =========================

    const unWatchSrcDstNetwork = watch([selectedSrcNetwork, selectedDstNetwork], async ([newSrc, newDst], [oldSrc, oldDst]) => {
        // Switch tokens and networks, if they are in the same network
        const isOldNotEmpty = oldSrc && oldDst && oldSrc?.net && oldDst?.net;
        const isNewNotEmpty = newSrc && newDst && newSrc?.net && newDst?.net;

        const isNewSrcNewDstSame = isNewNotEmpty && isOldNotEmpty && newSrc.net === newDst.net;

        const isSameToken = selectedSrcToken.value?.id === selectedDstToken.value?.id;

        if (isSameToken) {
            selectedDstToken.value = null;
            dstAmount.value = null;
        }

        const isSameNetwork = ['swap', 'bridge'].includes(moduleType) && isNewSrcNewDstSame;

        if (isSameNetwork) {
            [selectedSrcNetwork.value, selectedDstNetwork.value] = [oldDst, oldSrc];
            [selectedSrcToken.value, selectedDstToken.value] = [selectedDstToken.value, selectedSrcToken.value];

            return;
        }

        if (newSrc && !isSameNetwork) {
            checkSelectedNetwork();

            setTimeout(() => (estimateErrorTitle.value = ''));

            selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value, {
                from: 'watch-src-dst-network, if src',
            });

            if (['swap'].includes(moduleType)) {
                selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
                    from: 'watch-src-dst-network, if src swap dst',
                    isSameNet: true,
                    isExclude: true,
                    token: selectedSrcToken.value,
                });
            }
        }

        if (newDst && !isSameNetwork) {
            setTimeout(() => (estimateErrorTitle.value = ''));

            selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, {
                from: 'watch-src-dst-network, if dst',
            });
        }
    });

    const unWatchSrcDstToken = watch([srcAmount, selectedSrcToken, selectedDstToken], async () => {
        if (selectedSrcToken.value?.id === selectedDstToken.value?.id) {
            selectedDstToken.value = null;
            dstAmount.value = null;

            return;
        }
    });

    // ========================= Watch Is Need Approve for SRC token =========================

    const unWatchIsNeedApprove = watch(isNeedApprove, () => {
        checkSelectedNetwork();
        if (isNeedApprove.value) {
            return (opTitle.value = 'tokenOperations.approve');
        }
    });

    // ========================= Watch Tokens Loadings for SRC and DST networks =========================

    const unWatchLoadingSrc = watch(isTokensLoadingForSrc, async (loadingState, oldLoading) => {
        if (loadingState && !oldLoading) {
            return;
        }

        if (!loadingState && !selectedSrcNetwork.value) {
            return;
        }

        if (!selectedSrcNetwork.value) {
            return;
        }

        selectedSrcToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);

        if (!['swap'].includes(moduleType)) {
            return;
        }

        selectedDstToken.value = await setTokenOnChangeForNet(selectedSrcNetwork.value, selectedDstToken.value, {
            isSameNet: true,
            isExclude: true,
            token: selectedSrcToken.value,
        });
    });

    const unWatchLoadingDst = watch(isTokensLoadingForDst, async (loadingState) => {
        if (loadingState) {
            return;
        }

        if (!selectedDstNetwork.value) {
            return;
        }

        if (['send', 'swap'].includes(moduleType)) {
            return;
        }

        selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, {
            from: 'watch-loading-dst, if dst',
        });
    });

    // ========================= Watch Tx Error =========================
    const unWatchTxErr = watch(txError, () => {
        if (!txError.value) {
            return;
        }

        showNotification({
            key: 'error-tx',
            type: 'error',
            title: txErrorTitle.value,
            description: JSON.stringify(txError.value || 'Unknown error'),
            duration: 5,
        });

        closeNotification('prepare-tx');
    });

    // =================================================================================================================

    const unWatchBridgeDexRoutes = watch(bridgeDexRoutes, () => {
        console.log('watch-bridgeDexRoutes', bridgeDexRoutes.value, currentRouteInfo);

        selectedService.value = currentRouteInfo.value?.service;

        dstAmount.value = BigNumber(bestRouteInfo.value?.toTokenAmount).decimalPlaces(6).toString();

        console.log('watch-bridgeDexRoutes selectedService', selectedService.value);
    });

    // =================================================================================================================

    const callOnMounted = () => {
        // const isAccountAuth = walletAccount.value && currentChainInfo.value;

        if (
            // isAccountAuth &&
            !selectedSrcNetwork.value?.net
            // && currentChainInfo.value?.supported
        ) {
            selectedSrcNetwork.value = currentChainInfo.value;
        }

        if (!selectedSrcNetwork.value?.net && chainList.value?.length) {
            selectedSrcNetwork.value = chainList.value[0];
        }

        const isNetworkChanged =
            selectedSrcNetwork.value?.ecosystem !== currentChainInfo.value?.ecosystem &&
            selectedSrcNetwork.value?.net !== currentChainInfo.value?.net;

        if (
            // isAccountAuth &&
            isNetworkChanged
        ) {
            selectedSrcNetwork.value = currentChainInfo.value;
            srcAmount.value = '';
            dstAmount.value = '';
            selectedSrcToken.value = null;
            selectedDstToken.value = null;
        }

        if (
            ['super-swap', 'bridge'].includes(moduleType) &&
            chainList.value?.length > 1 &&
            selectedSrcNetwork.value?.net &&
            !selectedDstNetwork.value?.net
        ) {
            selectedDstNetwork.value = chainList.value?.filter(({ net }) => net !== selectedSrcNetwork.value?.net)[0];
        }
    };

    onMounted(async () => {
        callOnMounted();
        checkSelectedNetwork();
        await resetTokensForModules('onMounted');
    });

    onBeforeUnmount(() => {
        // Clear all data
        unWatchChainInfo();
        unWatchAcc();

        unWatchSrcDstNetwork();

        // unWatchDstToken();
        unWatchSrcDstToken();

        unWatchTxErr();

        unWatchIsNeedApprove();

        unWatchLoadingSrc();
        unWatchLoadingDst();

        unWatchBridgeDexRoutes();

        // Reset all data
        targetDirection.value = DIRECTIONS.SOURCE;
        selectedSrcNetwork.value = null;
        selectedSrcToken.value = null;
        selectedDstNetwork.value = null;
        selectedDstToken.value = null;
        receiverAddress.value = '';

        isEstimating.value = false;
        txError.value = '';
        isLoading.value = false;
        estimateErrorTitle.value = '';

        srcAmount.value = null;
        dstAmount.value = null;
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

        // Src token allowance and approve for service
        isNeedApprove,

        // Receiver
        isSendToAnotherAddress,
        isAddressError,
        receiverAddress,

        // Amounts
        srcAmount,
        dstAmount,

        // Memo
        isMemoAllowed,
        isSendWithMemo,
        memo,

        // Operation title
        opTitle,

        baseFeeInfo,
        rateFeeInfo,
        protocolFeeInfo,
        estimateTimeInfo,

        isShowEstimateInfo,

        // Errors
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

        // Functions
        openSelectModal,

        handleOnSelectToken,
        handleOnSelectNetwork,

        // setTokenOnChange,
        checkSelectedNetwork,
        swapDirections,

        // Bridge Dex
        isAllowanceLoading,
        isNeedApprove,
        isQuoteLoading,
        isRequireConnect,
        quoteErrorMessage,
        quoteRoutes,
        fees,
        selectedRoute,

        makeApproveRequest,
        makeSwapRequest,
        makeAllowanceRequest,
        clearAllowance,
    };
}
1;
