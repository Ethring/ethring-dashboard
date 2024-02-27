import BigNumber from 'bignumber.js';
import { utils } from 'ethers';

import { ref, computed, inject, watch, onBeforeUnmount, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

import { ECOSYSTEMS } from '@/Adapter/config';
import useEstimate from './useEstimate';

import {
    getAllowance,
    getApproveTx,
    cancelRequestByMethod,
    // getSwapTx,
    // getBridgeTx,
} from '@/api/services';

import useTokensList from '@/compositions/useTokensList';
import useNotification from '@/compositions/useNotification';

import { DIRECTIONS, FEE_TYPES, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';
import { STATUSES } from '@/shared/constants/super-swap/constants';

import { formatNumber } from '@/shared/utils/numbers';
import { useRouter } from 'vue-router';
// import { callMethodByService } from '@/api/bridge-dex';

export default function useModule({ moduleType }) {
    const { t } = useI18n();

    const router = useRouter();

    const { name: module } = router.currentRoute.value;

    const store = useStore();
    const useAdapter = inject('useAdapter');

    const servicesEVM = computed(() => store.getters['bridgeDex/getServicesByEcosystem'](ECOSYSTEMS.EVM) || []);
    const servicesCosmos = computed(() => store.getters['bridgeDex/getServicesByEcosystem'](ECOSYSTEMS.COSMOS) || []);

    const addressesByChains = ref({});

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

    const { walletAccount, walletAddress, currentChainInfo, chainList, getAddressesWithChainsByEcosystem } = useAdapter();

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

    const estimateErrorTitle = ref('');
    const isBalanceError = computed(() => BigNumber(srcAmount.value).gt(selectedSrcToken.value?.balance) || false);

    const isLoading = ref(false);
    const isEstimating = ref(false);

    const isUpdateSwapDirection = computed(() => {
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

    const allFees = computed(() => ({
        [FEE_TYPES.BASE]: baseFeeInfo.value,
        [FEE_TYPES.RATE]: rateFeeInfo.value,
        [FEE_TYPES.PROTOCOL]: protocolFeeInfo.value,
        [FEE_TYPES.TIME]: estimateTimeInfo.value,
    }));

    const resetFees = () => {
        const setEmpty = () => ({
            title: '',
            symbolBetween: '',
            fromAmount: '',
            fromSymbol: '',
            toAmount: '',
            toSymbol: '',
        });

        return (baseFeeInfo.value = rateFeeInfo.value = protocolFeeInfo.value = estimateTimeInfo.value = setEmpty());
    };

    const isShowEstimateInfo = computed(() => {
        if (estimateErrorTitle.value) {
            return true;
        }

        if (!srcAmount.value) {
            return false;
        }

        if (baseFeeInfo.value?.title || rateFeeInfo.value?.title || protocolFeeInfo.value?.title || estimateTimeInfo.value?.title) {
            return true;
        }

        return false;
    });

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
            selectedService.value.id,
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
            selectedService.value.id,
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

    const setEcosystemService = () => {
        if (['send'].includes(moduleType)) {
            return (selectedService.value = null);
        }

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
                selectedService.value = servicesCosmos.value.find(
                    (service) => service.id === DEFAULT_FOR_ECOSYSTEM[ECOSYSTEMS.COSMOS][moduleType],
                );

                addressesByChains.value = {};

                setOwnerAddresses();

                break;
            case ECOSYSTEMS.EVM:
                selectedService.value = servicesEVM.value.find(
                    (service) => service.id === DEFAULT_FOR_ECOSYSTEM[ECOSYSTEMS.EVM][moduleType],
                );

                addressesByChains.value = {};

                setOwnerAddresses();

                break;
        }
    };

    // =================================================================================================================

    const isAllowForRequest = () => {
        const notAllData = !walletAddress.value || !selectedSrcNetwork.value || !selectedService.value;

        if (notAllData) {
            return false;
        }

        if (estimateErrorTitle.value) {
            return false;
        }

        if (!srcAmount.value || !selectedSrcToken.value || !selectedDstToken.value) {
            return false;
        }

        const isNotEVM = selectedSrcNetwork.value?.ecosystem !== ECOSYSTEMS.EVM;

        return isNotEVM || true;
    };

    const prepareFeeInfo = (response) => {
        estimateErrorTitle.value = '';
        dstAmount.value = BigNumber(response.toTokenAmount).decimalPlaces(6).toString();

        const { estimatedTime = {}, protocolFee = null } = selectedService.value || {};
        const { chainId, chain_id, native_token = {} } = selectedSrcNetwork.value || {};
        const { symbol = null, price = 0 } = native_token || 0;

        // * Rate fee
        rateFeeInfo.value = {
            title: 'tokenOperations.rate',
            symbolBetween: '~',
            fromAmount: '1',
            fromSymbol: selectedSrcToken.value.symbol,
            toAmount: formatNumber(response.toTokenAmount / response.fromTokenAmount, 6),
            toSymbol: selectedDstToken.value.symbol,
        };

        // * Base fee
        if (response.fee) {
            baseFeeInfo.value = {
                title: 'tokenOperations.networkFee',
                symbolBetween: '~',
                fromAmount: formatNumber(response.fee.amount),
                fromSymbol: response.fee.currency,
                toAmount: formatNumber(BigNumber(response.fee.amount).multipliedBy(price).toString()),
                toSymbol: '$',
            };
        }

        if (moduleType === 'bridge' && selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.EVM) {
            baseFeeInfo.value.title = 'tokenOperations.serviceFee';

            baseFeeInfo.value.toAmount = formatNumber(
                BigNumber(response.fee?.amount).multipliedBy(selectedSrcToken.value?.price).toString(),
            );
        }

        // * Time
        const chain = chainId || chain_id;

        if (estimatedTime[chain]) {
            const time = Math.round(estimatedTime[chain] / 60);

            estimateTimeInfo.value = {
                title: 'tokenOperations.time',
                symbolBetween: '<',
                fromAmount: '',
                fromSymbol: '',
                toAmount: time,
                toSymbol: 'min',
            };
        }

        // * Protocol fee
        if (!protocolFee) {
            return;
        }

        const pFee = protocolFee[chain] || 0;

        if (!pFee) {
            return;
        }

        protocolFeeInfo.value = {
            title: 'tokenOperations.protocolFee',
            symbolBetween: '~',
            fromAmount: pFee,
            fromSymbol: symbol,
            toAmount: BigNumber(pFee).multipliedBy(price).toString(),
            toSymbol: '$',
        };
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

    const makeEstimateRequest = async () => {
        if (BigNumber(srcAmount.value).isEqualTo(0)) {
            isEstimating.value = false;
            isShowEstimateInfo.value = false;

            resetFees();

            return;
        }

        estimateErrorTitle.value = '';
        isEstimating.value = true;

        if (cancelRequestByMethod) {
            await cancelRequestByMethod('estimateSwap');
            await cancelRequestByMethod('estimateBridge');
        }

        if (!isAllowForRequest()) {
            isLoading.value = false;
            isEstimating.value = false;
            resetFees();
            return;
        }

        resetFees();

        const { getParams, makeRequest } = useEstimate({
            moduleType,
            selectedService,
            selectedSrcToken,
            selectedDstToken,
            selectedSrcNetwork,
            selectedDstNetwork,
            walletAddress,
            srcAmount,
            addressesByChains,
        });

        const params = getParams();
        const response = await makeRequest(params);

        if (response.error === 'canceled') {
            return;
        }

        if (response.error) {
            resetFees();

            estimateErrorTitle.value = response.error;
            dstAmount.value = '';
            isEstimating.value = false;

            return (isLoading.value = false);
        }

        // const checkRoute = () => {
        //     const isAmountSame = +response?.fromTokenAmount === +srcAmount.value;
        //     const isSrcTokenSame = params?.fromTokenAddress === selectedSrcToken.value?.address;
        //     const isDstTokenSame = params?.toTokenAddress === selectedDstToken.value?.address;

        //     return isAmountSame && isSrcTokenSame && isDstTokenSame;
        // };

        // if (!checkRoute()) {
        //     isEstimating.value = false;
        //     dstAmount.value = '';

        //     return (isLoading.value = false);
        // }

        isEstimating.value = false;
        isLoading.value = false;

        return prepareFeeInfo(response);
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

        setEcosystemService();

        if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
            return (opTitle.value = 'tokenOperations.approve');
        }

        if (isSameWithCurrent) {
            return (opTitle.value = DEFAULT_TITLE);
        }

        return (opTitle.value = 'tokenOperations.switchNetwork');
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
        if (withChains) {
            const from = JSON.parse(JSON.stringify(selectedSrcNetwork.value));
            const to = JSON.parse(JSON.stringify(selectedDstNetwork.value));

            [selectedSrcNetwork.value, selectedDstNetwork.value] = [to, from];
        }

        const from = JSON.parse(JSON.stringify(selectedSrcToken.value));
        const to = JSON.parse(JSON.stringify(selectedDstToken.value));

        [selectedSrcToken.value, selectedDstToken.value] = [to, from];

        await makeEstimateRequest();
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
        setEcosystemService();
    });

    // ========================= Watch Selected SRC DST Networks =========================

    const unWatchSrcDstNetwork = watch([selectedSrcNetwork, selectedDstNetwork], async ([newSrc, newDst], [oldSrc, oldDst]) => {
        // Switch tokens and networks, if they are in the same network
        const isOldNotEmpty = oldSrc && oldDst && oldSrc?.net && oldDst?.net;
        const isNewNotEmpty = newSrc && newDst && newSrc?.net && newDst?.net;

        const isNewSrcNewDstSame = isNewNotEmpty && isOldNotEmpty && newSrc.net === newDst.net;

        const isSameNetwork = ['swap', 'bridge'].includes(moduleType) && isNewSrcNewDstSame;

        if (isSameNetwork) {
            [selectedSrcNetwork.value, selectedDstNetwork.value] = [oldDst, oldSrc];
            [selectedSrcToken.value, selectedDstToken.value] = [selectedDstToken.value, selectedSrcToken.value];

            return;
        }

        if (newSrc && !isSameNetwork) {
            checkSelectedNetwork();

            resetFees();

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
            resetFees();

            setTimeout(() => (estimateErrorTitle.value = ''));

            selectedDstToken.value = await setTokenOnChangeForNet(selectedDstNetwork.value, selectedDstToken.value, {
                from: 'watch-src-dst-network, if dst',
            });
        }
    });

    // ========================= Watch Selected SRC Token =========================

    const unWatchSrcToken = watch(selectedSrcToken, async () => {
        const isEVM = ECOSYSTEMS.EVM === selectedSrcNetwork.value?.ecosystem;

        if (!isEVM || !selectedSrcToken.value?.address || !selectedService.value?.id) {
            return;
        }

        if (selectedSrcToken.value?.address && !srcTokenAllowance.value) {
            await makeAllowanceRequest(selectedService.value);
        }
    });

    const unWatchDstToken = watch(selectedDstToken, async () => {
        if (!['super-swap', 'send'].includes(moduleType)) {
            return await makeEstimateRequest();
        }
    });

    const unWatchSrcDstToken = watch([srcAmount, selectedSrcToken, selectedDstToken], async () => {
        if (selectedSrcToken.value?.id === selectedDstToken.value?.id) {
            selectedDstToken.value = null;
            dstAmount.value = null;
            return (estimateErrorTitle.value = t('tokenOperations.selectDifferentToken'));
        }

        if (['super-swap', 'send'].includes(moduleType)) {
            return;
        }

        return await makeEstimateRequest();
    });

    // ========================= Watch Is Need Approve for SRC token =========================

    const unWatchIsNeedApprove = watch(isNeedApprove, () => {
        checkSelectedNetwork();
        if (isNeedApprove.value && opTitle.value !== 'tokenOperations.switchNetwork') {
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

        unWatchSrcToken();
        unWatchDstToken();
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

        resetFees();

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

        // Operation Fees
        allFees,

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
        clearApproveForService,
        checkSelectedNetwork,

        swapDirections,

        // Requests to API services
        makeAllowanceRequest,
        makeApproveRequest,
        makeEstimateRequest,
    };
}
