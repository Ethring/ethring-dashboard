import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import BigNumber from 'bignumber.js';
import { ECOSYSTEMS } from '@/Adapter/config';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import _ from 'lodash';
import useAdapter from '@/Adapter/compositions/useAdapter';
import useBridgeDexService from '@/modules/bridge-dex/compositions';
import useChainTokenManger from './useChainTokenManager';
import { useStore } from 'vuex';

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
        resetQuoteRoutes,
    } = useBridgeDexService(moduleType);

    // =================================================================================================================

    const selectedService = computed({
        get: () => store.getters[`tokenOps/selectedService`],
        set: (value) => store.dispatch(`tokenOps/setSelectedService`, value),
    });

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

    const { walletAccount, currentChainInfo, chainList } = useAdapter();

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

    const isMemoAllowed = computed(() => selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS);
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

    const inputFocus = () => {
        const input = document.querySelector('input.input-balance');

        if (input && input instanceof HTMLInputElement && isNeedInputFocus.value) input.focus();
    };

    const checkSelectedNetwork = () => {
        if (!walletAccount.value && !currentChainInfo.value) {
            return (opTitle.value = 'tokenOperations.connectWallet');
        }

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

        resetQuoteRoutes();

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

        if (amount && _.startsWith(amount.toString(), '.') && amount.toString().length > 1) {
            return (srcAmount.value = `0${amount}`);
        }

        srcAmount.value = amount;
    };

    const toggleRoutesModal = () => store.dispatch('app/toggleModal', 'routesModal');

    const callOnMounted = () => {
        const isAccountAuth = walletAccount.value && currentChainInfo.value;

        const currentChain = store.getters['configs/getChainConfigByChainId'](currentChainInfo.value?.chain, ECOSYSTEMS.EVM);

        if (isAccountAuth && !selectedSrcNetwork.value?.net && Object.keys(currentChain).length) {
            selectedSrcNetwork.value = currentChainInfo.value;
        } else if (!selectedSrcNetwork.value?.net && chainList.value?.length) {
            selectedSrcNetwork.value = chainList.value[0];
        }
    }

    watch(isNeedApprove, () => {
        if (isNeedApprove.value) {
            opTitle.value = 'tokenOperations.approve';
        }
    });

    onMounted(() => {
        module.value = moduleType;

        checkSelectedNetwork();
    });

    watch(walletAccount, () => {
        checkSelectedNetwork();
    });

    watch(selectedRoute, () => {
        if (selectedRoute.value) {
            dstAmount.value = selectedRoute.value.toAmount;
        }
    });

    watch(isQuoteLoading, () => {
        if (!isQuoteLoading.value) nextTick(() => inputFocus());
    });

    onBeforeUnmount(() => {
        // Clear all data
        store.dispatch('tokenOps/resetFields');
        checkSelectedNetwork();
    });

    watch([isConfigsLoading, module], () => callOnMounted());

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

        // Fields
        fieldStates: computed(() => store.getters['moduleStates/getFieldsForModule'](moduleType)),
    };
}
