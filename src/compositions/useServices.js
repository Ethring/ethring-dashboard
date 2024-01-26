import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import { ref, computed, inject, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

import { ECOSYSTEMS } from '@/Adapter/config';

import { getServices } from '@/config/services';

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

import { DIRECTIONS } from '@/shared/constants/operations';

export default function useModule({ moduleType }) {
    const { t } = useI18n();

    const store = useStore();
    const useAdapter = inject('useAdapter');

    const servicesEVM = getServices(null, ECOSYSTEMS.EVM);
    const servicesCosmos = getServices(null, ECOSYSTEMS.COSMOS);

    const addressesByChains = ref({});

    const selectedService = computed({
        get: () => store.getters[`${moduleType}/service`],
        set: (value) => store.dispatch(`${moduleType}/setService`, value),
    });

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

    const { walletAccount, walletAddress, currentChainInfo, chainList, getAddressesWithChainsByEcosystem } = useAdapter();

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

    const isBalanceError = computed(() => BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance) || false);

    // =================================================================================================================

    const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](selectedSrcNetwork.value?.net));

    // =================================================================================================================

    const srcTokenAllowance = computed(() => {
        const isEVM = ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem;
        const requiredFields = selectedSrcToken.value?.address && selectedService.value?.id && walletAccount.value;

        if (!isEVM || !requiredFields) {
            return null;
        }

        return store.getters['tokenOps/allowanceForToken'](
            walletAccount.value,
            selectedSrcNetwork.value.net,
            selectedSrcToken.value.address,
            selectedService.value.id
        );
    });

    const srcTokenApprove = computed(() => {
        const isEVM = ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem;
        const requiredFields = selectedSrcToken.value?.address && selectedService.value?.id && walletAccount.value;

        if (!isEVM || !requiredFields) {
            return null;
        }

        return store.getters['tokenOps/approveForToken'](
            walletAccount.value,
            selectedSrcNetwork.value.net,
            selectedSrcToken.value.address,
            selectedService.value.id
        );
    });

    const isNeedApprove = computed(() => {
        if (['send'].includes(moduleType)) {
            return false;
        }

        try {
            if (
                !srcAmount.value ||
                selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.COSMOS ||
                !selectedSrcToken.value?.address ||
                !selectedSrcToken.value?.decimals
            ) {
                return false;
            }

            const currentAmount = utils.parseUnits(srcAmount.value, selectedSrcToken.value?.decimals).toString();

            return !BigNumber(currentAmount).lte(srcTokenAllowance.value);
        } catch {
            return false;
        }
    });

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
            return (selectedDstToken.value = null);
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

    const setEcosystemService = () => {
        if (!currentChainInfo.value?.ecosystem || !['swap', 'bridge'].includes(moduleType)) {
            return;
        }

        const DEFAULT_FOR_ECOSYSTEM = {
            [ECOSYSTEMS.EVM]: {
                swap: 'swap-paraswap',
                bridge: 'bridge-debridge',
            },
            [ECOSYSTEMS.COSMOS]: {
                swap: 'swap-skip',
                bridge: 'bridge-skip',
            },
        };

        switch (currentChainInfo.value?.ecosystem) {
            case ECOSYSTEMS.COSMOS:
                selectedService.value = servicesCosmos.find(
                    (service) => service.id === DEFAULT_FOR_ECOSYSTEM[ECOSYSTEMS.COSMOS][moduleType]
                );

                setOwnerAddresses();

                break;
            case ECOSYSTEMS.EVM:
                selectedService.value = servicesEVM.find((service) => service.id === DEFAULT_FOR_ECOSYSTEM[ECOSYSTEMS.EVM][moduleType]);

                setOwnerAddresses();

                break;
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

        const isEVM = ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem;
        const requiredFields = selectedSrcToken.value?.address && selectedService.value?.id && walletAccount.value;

        if (!requiredFields || !isEVM) {
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
        const requiredFields =
            selectedSrcToken.value?.address && selectedSrcNetwork.value?.net && currentService?.id && walletAddress.value;

        // store.dispatch('tokenOps/setAllowance', {
        //     chain: selectedSrcNetwork.value.net,
        //     account: walletAddress.value,
        //     tokenAddress: selectedSrcToken.value?.address,
        //     allowance: null,
        //     service: currentService?.id,
        // });

        if (!requiredFields) {
            return;
        }

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

        if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
            return (opTitle.value = 'tokenOperations.approve');
        }

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

    const swapDirections = async (withChains = false) => {
        if (withChains) {
            const from = JSON.parse(JSON.stringify(selectedSrcNetwork.value));
            const to = JSON.parse(JSON.stringify(selectedDstNetwork.value));

            [selectedSrcNetwork.value, selectedDstNetwork.value] = [to, from];
        }

        const from = JSON.parse(JSON.stringify(selectedSrcToken.value));
        const to = JSON.parse(JSON.stringify(selectedDstToken.value));

        [selectedSrcToken.value, selectedDstToken.value] = [to, from];
    };

    const setOwnerAddresses = () => {
        const addressesWithChains = getAddressesWithChainsByEcosystem(selectedSrcNetwork.value?.ecosystem);

        for (const chain in addressesWithChains) {
            const { address } = addressesWithChains[chain];

            addressesByChains.value = {
                ...addressesByChains.value,
                [chain]: address,
            };
        }
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

    const unWatchTokensLoading = watch(isTokensLoadingForChain, () => resetTokensForModules());

    const unWatchAcc = watch(walletAccount, () => {
        selectedSrcNetwork.value = currentChainInfo.value;
        selectedSrcToken.value = null;
        estimateErrorTitle.value = '';

        setEcosystemService();
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

    const unWatchSrcToken = watch(selectedSrcToken, async () => {
        const isEVM = ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem;

        if (!isEVM || !selectedSrcToken.value?.address || !selectedService.value?.id) {
            return;
        }

        if (selectedSrcToken.value?.address && !srcTokenAllowance.value) {
            return await makeAllowanceRequest(selectedService.value);
        }
    });

    const unWatchIsNeedApprove = watch(isNeedApprove, () => {
        checkSelectedNetwork();
        if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
            return (opTitle.value = 'tokenOperations.approve');
        }
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
    };

    onMounted(() => {
        callOnMounted();
        checkSelectedNetwork();
        resetTokensForModules();
        setEcosystemService();
    });

    onBeforeUnmount(() => {
        // Clear all data
        unWatchChainInfo();
        unWatchAcc();
        unWatchSrc();
        unWatchTxErr();
        unWatchEstimateError();
        unWatchSrcToken();
        unWatchTokensLoading();
        unWatchIsNeedApprove();

        // Reset all data
        targetDirection.value = DIRECTIONS.SOURCE;
        selectedSrcNetwork.value = null;
        selectedSrcToken.value = null;
        selectedDstNetwork.value = null;
        selectedDstToken.value = null;
        receiverAddress.value = '';

        srcAmount.value = null;
        dstAmount.value = null;
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

        // Src token allowance and approve for service
        srcTokenAllowance,
        srcTokenApprove,
        isNeedApprove,

        // Receiver
        receiverAddress,
        addressesByChains,

        // Amounts
        srcAmount,
        dstAmount,

        // Operation title
        opTitle,

        // Errors
        txError,
        txErrorTitle,
        isBalanceError,
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

        swapDirections,

        // Requests to API services
        makeAllowanceRequest,
        makeApproveRequest,
    };
}
