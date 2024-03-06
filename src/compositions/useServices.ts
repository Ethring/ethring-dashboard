import BigNumber from 'bignumber.js';
import _ from 'lodash';

import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useBridgeDexService from '@/modules/bridge-dex/compositions';

import { STATUSES } from '@/shared/models/enums/statuses.enum';
import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import useChainTokenManger from './useChainTokenManager';

export default function useModule(moduleType: ModuleType) {
    const store = useStore();

    useChainTokenManger(moduleType);

    const selectedSrcNetwork = computed({
        get: () => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
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
    } = useBridgeDexService(moduleType);

    // =================================================================================================================

    const selectedService = computed({
        get: () => store.getters[`tokenOps/selectedService`],
        set: (value) => store.dispatch(`tokenOps/setSelectedService`, value),
    });

    const isWaitingTxStatusForModule = computed(() => store.getters['txManager/isWaitingTxStatusForModule'](moduleType));

    // * Bridge Dex
    const bridgeDexRoutes = computed(() => store.getters['bridgeDex/selectedRoute']);
    const bestRouteInfo = computed(() => bridgeDexRoutes.value?.bestRoute);
    const currentRouteInfo = computed(() => bestRouteInfo.value?.routes.find((elem) => elem.status === STATUSES.SIGNING));

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

    const handleOnSetAmount = (amount: string | number) => {
        if (srcAmount.value === amount) {
            return;
        }

        srcAmount.value = amount;
    };

    const toggleRoutesModal = () => store.dispatch('app/toggleModal', 'routesModal');

    watch(isNeedApprove, () => {
        checkSelectedNetwork();

        if (isNeedApprove.value) {
            opTitle.value = 'tokenOperations.approve';
        }
    });

    onBeforeUnmount(() => {
        // Clear all data

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
        toggleRoutesModal,

        handleOnSelectToken,
        handleOnSelectNetwork,

        handleOnSetAmount,

        // setTokenOnChange,
        checkSelectedNetwork,
        handleOnSwapDirections,

        // Bridge Dex
        isAllowanceLoading,
        isNeedApprove,
        isQuoteLoading,
        quoteErrorMessage,
        quoteRoutes,
        otherRoutes,
        fees,
        selectedRoute,

        makeApproveRequest,
        makeSwapRequest,
        makeAllowanceRequest,
        clearAllowance,
    };
}
