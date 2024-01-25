import { ref, computed, inject, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

import {
    getAllowance,
    getApproveTx,
    cancelRequestByMethod,
    // estimateSwap,
    // estimateBridge,
    // getSwapTx,
    // getBridgeTx,
} from '@/api/services';

import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';

// import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

export default function useModule({ moduleType }) {
    const { t } = useI18n();

    const store = useStore();
    const useAdapter = inject('useAdapter');

    const selectedService = computed(() => store.getters[`${moduleType}/selectedService`]);

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
    const isUpdateSwapDirection = ref(false);

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

    const selectedSrcNetwork = computed({
        get: () => store.getters['tokenOps/srcNetwork'],
        set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
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

    const estimateErrorTitle = ref('');

    // =================================================================================================================
    const setTokenOnChangeForNet = (srcNet, token) => {
        tokensList.value = getTokensList({
            srcNet,
        });

        const [defaultToken = null] = tokensList.value;

        if (!token && defaultToken) {
            return defaultToken;
        }

        const { symbol: targetSymbol } = token || {};

        const searchTokens = [targetSymbol];

        const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];
        if (!updatedList.length) {
            return token;
        }

        const [tkn = null] = updatedList;

        if (onlyWithBalance.value && tkn?.balance === 0) {
            return null;
        }

        if (tkn) {
            return tkn;
        }

        return token;
    };

    const setTokenOnChange = () => {
        tokensList.value = getTokensList({
            srcNet: selectedSrcNetwork.value,
        });

        const [defaultFromToken = null, defaultToToken = null] = tokensList.value || [];

        if ((!selectedSrcToken.value && defaultFromToken) || selectedSrcToken.value?.balance === 0) {
            selectedSrcToken.value = defaultFromToken;
        }

        if (selectedSrcToken.value?.address === selectedDstToken.value?.address) {
            selectedDstToken.value = null;
        }

        if (selectedDstNetwork.value && defaultToToken?.chain !== selectedDstNetwork.value?.net) {
            return;
        }

        if (moduleType === 'send') {
            selectedDstToken.value = null;
            return;
        }

        const isSrcTokenExistInList = tokensList.value?.find((tkn) => tkn.id === selectedSrcToken.value?.id) || null;
        const isDstTokenExistInList = tokensList.value?.find((tkn) => tkn.id === selectedDstToken.value?.id) || null;

        if (isSrcTokenExistInList) {
            selectedSrcToken.value = isSrcTokenExistInList;
        }

        if (isDstTokenExistInList) {
            selectedDstToken.value = isDstTokenExistInList;
        }
    };

    // =================================================================================================================

    const makeAllowanceRequest = async (service) => {
        const currentService = service || selectedService.value;

        if (!selectedSrcToken.value?.address || !currentService?.url) {
            return;
        }

        const response = await getAllowance({
            url: currentService.url,
            net: selectedSrcNetwork.value.net,
            tokenAddress: selectedSrcToken.value.address,
            ownerAddress: walletAddress.value,
            store,
            service: currentService,
        });

        if (response.error) {
            return;
        }
    };

    const makeApproveRequest = async (service) => {
        const currentService = service || selectedService.value;

        if (!selectedSrcToken.value?.address || !currentService?.url) {
            return;
        }

        if (cancelRequestByMethod) {
            await cancelRequestByMethod('getApproveTx');
        }

        const response = await getApproveTx({
            url: currentService.url,
            net: selectedSrcNetwork.value.net,
            tokenAddress: selectedSrcToken.value.address,
            ownerAddress: walletAddress.value,
            store,
            service: currentService,
        });

        if (response.error) {
            return (txError.value = response?.error || response);
        }

        checkSelectedNetwork();

        if (opTitle.value !== 'tokenOperations.switchNetwork') {
            opTitle.value = 'tokenOperations.approve';
        }
    };

    // =================================================================================================================

    const clearApproveForService = (service) => {
        const currentService = service || selectedService.value;

        store.dispatch('tokenOps/setAllowance', {
            chain: selectedSrcNetwork.value.net,
            account: walletAddress.value,
            tokenAddress: selectedSrcToken.value?.address,
            allowance: null,
            service: currentService?.id,
        });

        store.dispatch('tokenOps/setApprove', {
            chain: selectedSrcNetwork.value.net,
            account: walletAddress.value,
            tokenAddress: selectedSrcToken.value?.address,
            approve: null,
            service: currentService?.id,
        });
    };

    // =================================================================================================================

    const checkSelectedNetwork = () => {
        // if (!walletAccount.value && !currentChainInfo.value) {
        //     return (opTitle.value = 'tokenOperations.connectWallet');
        // }

        const isSameWithCurrent = currentChainInfo.value && currentChainInfo.value.net === selectedSrcNetwork.value?.net;

        if (isSameWithCurrent) {
            return (opTitle.value = DEFAULT_TITLE);
        }

        return (opTitle.value = 'tokenOperations.switchNetwork');
    };

    const resetTokensForModules = () => {
        const isSrcTokenChanged = selectedSrcToken.value && selectedSrcToken.value.chain !== selectedSrcNetwork.value?.net;
        const isDstTokenChanged = selectedDstToken.value && selectedDstToken.value.chain !== selectedDstNetwork.value?.net;

        const isDstTokenChangedForSwap = selectedDstToken.value?.chain !== selectedSrcNetwork.value?.net;

        switch (moduleType) {
            case 'swap':
                if (isSrcTokenChanged) {
                    selectedSrcToken.value = null;
                }

                if (isDstTokenChangedForSwap) {
                    selectedDstToken.value = null;
                }

                setTokenOnChange();

                break;

            case 'send':
                selectedDstToken.value = null;

                if (isSrcTokenChanged) {
                    selectedSrcToken.value = null;
                }

                setTokenOnChange();

                break;

            case 'bridge':
            case 'superSwap':
                if (isSrcTokenChanged) {
                    selectedSrcToken.value = null;
                    setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
                }

                if (isDstTokenChanged) {
                    selectedDstToken.value = null;
                    setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value);
                }

                break;
        }
    };

    const onSelectSrcNetwork = (network) => {
        if (selectedSrcNetwork.value?.net === network?.net) {
            return false;
        }

        onlyWithBalance.value = true;

        selectedSrcNetwork.value = network;

        if (currentChainInfo.value?.net !== selectedSrcNetwork.value?.net) {
            selectedSrcToken.value = null;
            selectedDstToken.value = null;
            srcAmount.value = '';
            dstAmount.value = '';
        }

        resetTokensForModules();

        return true;
    };

    // =================================================================================================================

    const openSelectModal = (selectFor, { direction, type }) => {
        direction && (targetDirection.value = direction);
        type && (selectType.value = type);

        store.dispatch('app/toggleSelectModal', selectFor);
    };

    const handleOnSelectNetwork = ({ direction, type }) => {
        return openSelectModal('network', { direction, type });
    };

    const handleOnSelectToken = ({ direction, type }) => {
        return openSelectModal('token', { direction, type });
    };

    // =================================================================================================================

    const unWatchChainInfo = watch(currentChainInfo, () => {
        checkSelectedNetwork();
        selectedSrcNetwork.value = currentChainInfo.value;
        resetTokensForModules();
    });

    const unWatchAcc = watch(walletAccount, () => {
        selectedSrcNetwork.value = currentChainInfo.value;
        selectedSrcToken.value = null;
        resetTokensForModules();
    });

    const unWatchSrc = watch(selectedSrcNetwork, (newNet, oldNet) => {
        if (isUpdateSwapDirection.value) {
            return;
        }
        if (!oldNet) {
            resetTokensForModules();
            return checkSelectedNetwork();
        }

        if (newNet?.net === oldNet?.net) {
            return;
        } else {
            srcAmount.value = '';
            dstAmount.value = '';
        }

        if (currentChainInfo.value?.net !== selectedSrcNetwork.value?.net) {
            selectedSrcToken.value = null;
        }

        resetTokensForModules();

        return checkSelectedNetwork();
    });

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

    // Watch change and show error if tokens or network empty
    const unWatchEstimateError = watch([selectedDstNetwork, selectedSrcToken, selectedDstToken], () => {
        if (!selectedDstNetwork.value && !['swap', 'send'].includes(moduleType)) {
            return (estimateErrorTitle.value = t('tokenOperations.selectDstNetwork'));
        }

        if (!selectedSrcToken.value) {
            return (estimateErrorTitle.value = t('tokenOperations.selectSrcToken'));
        }

        if (!selectedDstToken.value) {
            return (estimateErrorTitle.value = t('tokenOperations.selectDstToken'));
        }

        // if (['swap', 'send'].includes(moduleType) && estimateErrorTitle.value === t('tokenOperations.selectDstToken')) {
        //     estimateErrorTitle.value = '';
        // }

        return (estimateErrorTitle.value = '');
    });

    // =================================================================================================================

    const callOnMounted = () => {
        // const isAccountAuth = walletAccount.value && currentChainInfo.value;

        if (
            // isAccountAuth &&
            !selectedSrcNetwork.value?.net &&
            currentChainInfo.value?.supported
        ) {
            selectedSrcNetwork.value = currentChainInfo.value;
        } else if (!selectedSrcNetwork.value?.net && chainList.value?.length) {
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
    };

    onMounted(() => {
        callOnMounted();
        checkSelectedNetwork();
        resetTokensForModules();
    });

    onBeforeUnmount(() => {
        // Clear all data
        unWatchChainInfo();
        unWatchAcc();
        unWatchSrc();
        unWatchTxErr();
        unWatchEstimateError();
    });

    return {
        // Main information for operation
        selectedSrcToken,
        selectedDstToken,
        selectedSrcNetwork,
        selectedDstNetwork,

        selectType,
        targetDirection,
        onlyWithBalance,
        isUpdateSwapDirection,

        // Receiver
        receiverAddress,

        // Amounts
        srcAmount,
        dstAmount,

        // Operation title
        opTitle,

        // Errors
        txError,
        txErrorTitle,
        estimateErrorTitle,

        // Functions
        openSelectModal,

        handleOnSelectToken,
        handleOnSelectNetwork,

        setTokenOnChange,
        resetTokensForModules,
        setTokenOnChangeForNet,
        clearApproveForService,
        checkSelectedNetwork,

        onSelectSrcNetwork,

        // Requests to API services
        makeAllowanceRequest,
        makeApproveRequest,
    };
}
