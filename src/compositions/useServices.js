import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

import {
    getAllowance,
    getApproveTx,
    // estimateSwap,
    // estimateBridge,
    // getSwapTx,
    // getBridgeTx,
} from '@/api/services';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';

export default function useModule({ module, moduleType }) {
    console.log('useModule', module);
    const store = useStore();

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

    const { walletAccount, walletAddress, currentChainInfo } = useAdapter();

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
    const setTokenOnChangeForNet = (srcNet, token) => {
        tokensList.value = getTokensList({
            srcNet,
        });

        const [defaultToken = null] = tokensList.value;

        if (onlyWithBalance.value && defaultToken?.balance === 0) {
            return null;
        }

        if (!token && defaultToken) {
            return defaultToken;
        }

        const { symbol: targetSymbol } = token || {};

        const searchTokens = [targetSymbol];

        const updatedList = tokensList.value?.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

        if (!updatedList.length) {
            return;
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
            srcToken: selectedSrcToken.value,
            dstNet: selectedDstNetwork.value,
        });

        const [defaultFromToken = null, defaultToToken = null] = tokensList.value || [];

        if (!selectedSrcToken.value && defaultFromToken) {
            selectedSrcToken.value = defaultFromToken;
        }

        if (selectedSrcToken.value?.address === selectedDstToken.value?.address) {
            selectedDstToken.value = null;
        }

        if (!selectedDstToken.value && defaultToToken) {
            selectedDstToken.value = defaultToToken;
        }

        if (!selectedSrcToken.value && !selectedDstToken.value) {
            return;
        }

        const { symbol: fromSymbol } = selectedSrcToken.value || {};
        const { symbol: toSymbol } = selectedSrcToken.value || {};

        const searchTokens = [fromSymbol, toSymbol];

        const updatedList = tokensList.value.filter((tkn) => searchTokens.includes(tkn.symbol)) || [];

        if (!updatedList.length) {
            return;
        }

        const [fromToken = null, toToken = null] = updatedList;

        if (fromToken) {
            selectedSrcToken.value = fromToken;
        }

        if (onlyWithBalance.value && selectedSrcToken.value?.balance === 0) {
            selectedSrcToken.value = null;
        }

        if (toToken && !selectedDstToken.value) {
            selectedDstToken.value = toToken;
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
        console.log('makeApproveRequest', currentService);

        if (!selectedSrcToken.value?.address || !currentService?.url) {
            return;
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
            account: walletAccount.value,
            tokenAddress: selectedSrcToken.value?.address,
            allowance: null,
            service: currentService?.id,
        });

        store.dispatch('tokenOps/setApprove', {
            chain: selectedSrcNetwork.value.net,
            account: walletAccount.value,
            tokenAddress: selectedSrcToken.value?.address,
            approve: null,
            service: currentService?.id,
        });
    };

    // =================================================================================================================

    const checkSelectedNetwork = () => {
        if (currentChainInfo.value?.net === selectedSrcNetwork.value?.net) {
            return (opTitle.value = DEFAULT_TITLE);
        }

        return (opTitle.value = 'tokenOperations.switchNetwork');
    };

    watch(currentChainInfo, () => {
        selectedSrcNetwork.value = currentChainInfo.value;
    });

    watch(walletAccount, () => {
        selectedSrcNetwork.value = currentChainInfo.value;
        selectedSrcToken.value = null;
        setTokenOnChange();
    });

    watch(selectedSrcNetwork, () => {
        if (moduleType === 'swap') {
            selectedSrcToken.value = null;
            selectedDstToken.value = null;
            setTokenOnChange();
        } else {
            setTokenOnChangeForNet(selectedSrcNetwork.value, selectedSrcToken.value);
        }

        checkSelectedNetwork();
    });

    watch(currentChainInfo, () => checkSelectedNetwork());

    watch(txError, () => {
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

    checkSelectedNetwork();

    return {
        // Main information for operation
        selectedSrcToken,
        selectedDstToken,
        selectedSrcNetwork,
        selectedDstNetwork,

        selectType,
        targetDirection,
        onlyWithBalance,

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

        // Functions
        setTokenOnChange,
        setTokenOnChangeForNet,
        clearApproveForService,
        checkSelectedNetwork,

        // Requests to API services
        makeAllowanceRequest,
        makeApproveRequest,
    };
}
