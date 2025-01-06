import { computed, onUnmounted, ref, watch } from 'vue';
import { useStore, Store } from 'vuex';
import BigNumber from 'bignumber.js';

import BridgeDexService from '@/modules/bridge-dex';
import { ModulesByService, ServiceType, ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';

import { IQuoteRoute, ErrorResponse } from '@/modules/bridge-dex/models/Response.interface';
import { NATIVE_CONTRACT } from '@/core/wallet-adapter/config';

import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

import { FeeInfo } from '@/shared/models/types/Fee';
import { calculateFeeByCurrency, calculateFeeInNativeToUsd } from '@/shared/calculations/calculate-fee';

import { AddressByChainHash } from '@/shared/models/types/Address';

import logger from '@/shared/logger';
import { isEqual, debounce } from 'lodash';
import useInputValidation from '@/shared/form-validations';
import { useRoute } from 'vue-router';

/**
 *
 * @composition useBridgeDexQuote
 * @description Composition for handling quote requests for BridgeDex services
 *
 * @important This composition is used in the useBridgeDexService composition, QUOTE available for all networks
 *
 * @param {ServiceTypes} targetType - The target service type (superswap, dex, bridgedex)
 * @param {BridgeDexService<any>} bridgeDexService - The BridgeDexService instance for the target service type
 *
 * @returns {Object} - Object containing the following:
 *
 * - isQuoteLoading - A boolean ref for the loading state of the quote request
 * - fees - A computed ref for the fee info
 * - makeQuoteRoutes - A function for making a quote request to the service
 * - quoteErrorMessage - A ref for the quote route error message
 *
 */
const useBridgeDexQuote = (
    targetType: ServiceTypes,
    bridgeDexService: BridgeDexService<any>,
    { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null },
) => {
    const DEBOUNCE_TIME = 1000;

    const store = process.env.NODE_ENV === 'test' ? (tmpStore as Store<any>) : useStore();

    const route = useRoute();

    const serviceType = ServiceType[targetType];

    const modules: string[] = ModulesByService[targetType] || [];

    const {
        isSrcAmountSet,
        isDstAmountSet,
        isSameToken,
        isSameNetwork,
        isSameTokenSameNet,
        isSrcTokenChainCorrect,
        isDstTokenChainCorrect,
        isDstTokenChainCorrectSwap,
        isQuoteRouteSet,
        isQuoteRouteSelected,
    } = useInputValidation({ tmpStore: store });

    // ===========================================================================================
    // * Loading
    // ===========================================================================================
    const isQuoteLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('quote'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'quote', value }),
    });

    const isReloadRoutes = computed({
        get: () => store.getters['bridgeDexAPI/isReloadRoutes'],
        set: (value) => store.dispatch('bridgeDexAPI/setReloadRoutes', value),
    });

    // ===========================================================================================
    // !Quote Route Error Message
    // ===========================================================================================
    const quoteErrorMessage = computed({
        get: () => store.getters['bridgeDexAPI/getQuoteErrorMessage'],
        set: (value) => store.dispatch('bridgeDexAPI/setQuoteErrorMessage', value),
    });

    // ===========================================================================================
    // * Quote Routes List by ServiceType (bridge, dex, bridgedex)
    // ===========================================================================================

    const selectedRoute = computed<IQuoteRoute>(() => store.getters['bridgeDexAPI/getSelectedRoute'](targetType));

    // ===========================================================================================
    // * Selected Token and Network
    // ===========================================================================================

    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
    const selectedDstNetwork = computed(() => store.getters['tokenOps/dstNetwork']);
    const selectedSrcToken = computed(() => store.getters['tokenOps/srcToken']);
    const selectedDstToken = computed(() => store.getters['tokenOps/dstToken']);
    const srcAmount = computed(() => store.getters['tokenOps/srcAmount']);

    const shortcutServiceId = computed(() => store.getters['tokenOps/getServiceId'](ModuleType.shortcut));

    // ===========================================================================================
    // * Address
    // ===========================================================================================

    const srcAddressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        if (!srcEcosystem) return {};
        return store.getters['adapters/getAddressesByEcosystem'](srcEcosystem) as AddressByChainHash;
    });

    const dstAddressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};
        if (!dstEcosystem) return {};
        return store.getters['adapters/getAddressesByEcosystem'](dstEcosystem) as AddressByChainHash;
    });

    const addressByChain = computed<AddressByChainHash>(() => {
        const { ecosystem: srcEcosystem } = selectedSrcNetwork.value || {};
        const { ecosystem: dstEcosystem } = selectedDstNetwork.value || {};

        if (srcEcosystem !== dstEcosystem)
            return {
                ...srcAddressByChain.value,
                ...dstAddressByChain.value,
            };

        return srcAddressByChain.value;
    });

    // ===========================================================================================
    // * Utils
    // ===========================================================================================
    const resetQuoteRoutes = () => {
        if (!targetType) return;

        bridgeDexService.cancelRequest();

        isQuoteLoading.value = false;

        store.dispatch('bridgeDexAPI/setQuoteRoutes', {
            serviceType: targetType,
            value: null,
        });

        store.dispatch('bridgeDexAPI/setSelectedRoute', {
            serviceType: targetType,
            value: null,
        });

        store.dispatch('tokenOps/setDstAmount', '');
    };

    const debouncedMakeQuoteRoutes = debounce(async (params: AllQuoteParams) => {
        await makeQuoteRoutes(params);
        isReloadRoutes.value && (isReloadRoutes.value = false);
    }, DEBOUNCE_TIME);

    // ===========================================================================================
    // !Validation
    // ===========================================================================================
    // ?Check if the request is allowed
    const isAllowToMakeRequest = () => {
        const defaultValidation = () => {
            return isSrcTokenChainCorrect.value && isDstTokenChainCorrect.value && isSrcAmountSet.value;
        };

        const superSwapValidation = () => {
            if (isSameNetwork.value && isSameToken.value) return false;
            return defaultValidation();
        };

        const swapValidation = () => {
            if (isSameToken.value) return false;
            return isSrcTokenChainCorrect.value && isDstTokenChainCorrectSwap.value && isSrcAmountSet.value;
        };

        switch (true) {
            case modules.includes(ModuleType.send):
                return false; // !If the module is send, return false, because the request is not allowed

            case modules.includes(ModuleType.superSwap):
                return superSwapValidation();

            case modules.includes(ModuleType.swap):
                return swapValidation();

            default:
                return defaultValidation();
        }
    };

    const isShowEstimateInfo = computed(() => {
        const mainRequired = isQuoteRouteSet.value && isQuoteRouteSelected.value && isSrcAmountSet.value && isDstAmountSet.value;

        if (isQuoteLoading.value) return true;

        if (quoteErrorMessage.value) return true;

        return mainRequired;
    });

    // ===========================================================================================
    // * Requests to the Service by ServiceType
    // ===========================================================================================

    const makeQuoteRoutes = async (requestParams: AllQuoteParams) => {
        // !If the route is shortcuts, return because the request is not needed, the shortcuts has own logic for making a quote request
        if (route.path.startsWith('/shortcuts')) return;

        // !If the request is not allowed, return
        if (!isAllowToMakeRequest()) {
            quoteErrorMessage.value = 'Please select the correct source and destination tokens, and fill amount';
            return (isQuoteLoading.value = false);
        }

        // !If the quote is loading, abort previous request call
        if (isQuoteLoading.value) bridgeDexService.cancelRequest();

        const isDex = serviceType === ServiceType.dex;
        const isSameToken = requestParams.fromToken === requestParams.toToken;

        requestParams.ownerAddresses = addressByChain.value;

        // !If it's a dex and the tokens are the same, return
        if (isDex && isSameToken) {
            resetQuoteRoutes();
            return (isQuoteLoading.value = false);
        }

        // TODO: Optimize this
        if (requestParams.fromNet === requestParams.toNet) requestParams.serviceId = 'lifiswap';
        else requestParams.serviceId = 'lifibridge';

        // !If the tokens & networks are the same, return
        if (isSameToken && isSameNetwork.value) {
            resetQuoteRoutes();
            return (isQuoteLoading.value = false);
        }

        !requestParams.fromToken && (requestParams.fromToken = NATIVE_CONTRACT);
        !requestParams.toToken && (requestParams.toToken = NATIVE_CONTRACT);

        try {
            isQuoteLoading.value = true;
            quoteErrorMessage.value = '';

            shortcutServiceId.value && (requestParams.serviceId = shortcutServiceId.value);

            const withServiceId = requestParams.serviceId ? true : false;

            if (selectedRoute.value && selectedRoute.value.routeId)
                store.dispatch('bridgeDexAPI/clearRouteTimer', { routeId: selectedRoute.value.routeId });

            const { best = null, routes = [] } = await bridgeDexService.getQuote(requestParams, { withServiceId });

            // let routeFromAPI = routes.find(({ serviceId }) => serviceId === best) as IQuoteRoute;
            let routeFromAPI = routes.find(({ serviceId }) => serviceId === requestParams.serviceId) as IQuoteRoute;

            if (!routeFromAPI) return resetQuoteRoutes();

            if (+routeFromAPI.toAmount <= 0) throw new Error('Failed to get route, try again');

            if (!routes.length) return resetQuoteRoutes();

            // * If there is only one route, set it as selected
            if (routes.length === 1 && !routeFromAPI) routeFromAPI = routes[0];

            store.dispatch('bridgeDexAPI/setRouteTimer', { type: serviceType, routeId: routeFromAPI.routeId });

            store.dispatch('bridgeDexAPI/setSelectedRoute', {
                serviceType: targetType,
                value: routeFromAPI,
            });

            store.dispatch('bridgeDexAPI/setQuoteRoutes', {
                serviceType: targetType,
                value: routes,
            });

            return {
                best,
                routes,
            };
        } catch (error: any) {
            if (error.code === 'ERR_CANCELED') return;

            console.error('useBridgeDexQuote -> makeQuoteRoutes', error);
            quoteErrorMessage.value = error?.message || 'An error occurred while making a quote request';

            throw error as ErrorResponse;
        } finally {
            if (selectedRoute.value && selectedRoute.value?.toAmount) store.dispatch('tokenOps/setDstAmount', selectedRoute.value.toAmount);
            isQuoteLoading.value = false;
        }
    };

    // ===========================================================================================
    // * Fee Info Section
    // ===========================================================================================

    const emptyFee = ref<FeeInfo>({
        title: '',
        symbolBetween: '',
        fromAmount: '',
        fromSymbol: '',
        toAmount: '',
        toSymbol: '',
    });

    const rateFeeInfo = computed<FeeInfo>(() => {
        const { fromAmount = 0, toAmount = 0 } = selectedRoute.value || {};

        if (!fromAmount || !toAmount) return emptyFee.value;

        const { symbol: fromSymbol } = selectedSrcToken.value || {};
        const { symbol: toSymbol } = selectedDstToken.value || {};

        const symbolBetween = '~';

        const rate = BigNumber(toAmount).dividedBy(fromAmount).toString();

        const rateFee = {
            symbolBetween,
            fromAmount: '1',
            fromSymbol,
            toAmount: rate,
            toSymbol,
        };

        if (isAllowToMakeRequest()) return rateFee;

        return emptyFee.value;
    });

    const feeInCurrency = computed(() => {
        const { native_token = {} } = selectedSrcNetwork.value || {};
        const { symbol = null, price = 0 } = native_token || 0;

        const { fee = [] } = selectedRoute.value || {};

        if (!fee.length) return '0';

        const usdFee = calculateFeeByCurrency(selectedRoute.value, 'USD');

        const nativeTokenFeeToUsd = calculateFeeInNativeToUsd(selectedRoute.value, { symbol, price });

        const targetFee = nativeTokenFeeToUsd.isZero() ? usdFee : nativeTokenFeeToUsd;

        if (isAllowToMakeRequest()) return targetFee.toString();

        return null;
    });

    const allFees = computed(() => ({
        [FEE_TYPE.RATE]: rateFeeInfo.value,
        [FEE_TYPE.BASE]: feeInCurrency.value,
        [FEE_TYPE.PROTOCOL]: emptyFee.value,
    }));

    // ===========================================================================================
    // * Watchers
    // ===========================================================================================

    // * Watching multiple values to make a quote request
    // 1. When the selectedSrcNetwork, selectedDstNetwork, selectedSrcToken, selectedDstToken, srcAmount change
    // 2. Check if the selectedSrcNetwork, selectedDstNetwork, selectedSrcToken, selectedDstToken, srcAmount are set
    // 3. If they are set, make a quote request
    const unWatchChanges = watch(
        [isReloadRoutes, srcAmount, selectedSrcNetwork, selectedDstNetwork, selectedSrcToken, selectedDstToken],
        async (
            [],
            [oldIsReloadRoutes, oldSrcAmount, oldSelectedSrcNetwork, oldSelectedDstNetwork, oldSelectedSrcToken, oldSelectedDstToken],
        ) => {
            // Return if the module is send or the selected destination token is not set or the request is not allowed
            if (!isAllowToMakeRequest()) {
                resetQuoteRoutes();
                return;
            }

            // * If the selected source network, destination network, source token, destination token, source amount are set, make a quote request
            // * Params for making a quote request
            const params = {
                // For dex
                net: selectedSrcNetwork.value.net,

                // For bridgedex
                fromNet: selectedSrcNetwork.value.net,
                toNet: selectedDstNetwork.value?.net,

                // others
                fromToken: selectedSrcToken.value?.address,
                toToken: selectedDstToken.value?.address,

                ownerAddresses: addressByChain.value,

                amount: srcAmount.value,
            } as AllQuoteParams;

            const oldParams = {
                // For dex
                net: oldSelectedSrcNetwork?.net,

                // For bridgedex
                fromNet: oldSelectedSrcNetwork?.net,
                toNet: oldSelectedDstNetwork?.net,

                // others
                fromToken: oldSelectedSrcToken?.address,
                toToken: oldSelectedDstToken?.address,

                ownerAddresses: addressByChain.value,

                amount: oldSrcAmount,
            } as AllQuoteParams;

            // * If the params are not changed, return
            if (
                isEqual(
                    {
                        ...params,
                        fromToken: selectedSrcToken.value?.id,
                        toToken: selectedDstToken.value?.id,
                        isReloadRoutes: isReloadRoutes.value,
                        ownerAddresses: {},
                    },
                    {
                        ...oldParams,
                        fromToken: oldSelectedSrcToken?.id,
                        toToken: oldSelectedDstToken?.id,
                        isReloadRoutes: oldIsReloadRoutes,
                        ownerAddresses: {},
                    },
                )
            )
                return;

            try {
                resetQuoteRoutes();
                isQuoteLoading.value = true;
                debouncedMakeQuoteRoutes.cancel();
                debouncedMakeQuoteRoutes(params);
            } catch (error) {
                logger.error('useBridgeDexQuote -> makeQuoteRoutes', error);
            }
        },
    );

    const unWatchLoading = watch(isQuoteLoading, () => {
        if (!isQuoteLoading.value) isReloadRoutes.value && (isReloadRoutes.value = false);
    });

    // ===========================================================================================
    // * Cleanup
    // ===========================================================================================
    onUnmounted(() => {
        isQuoteLoading.value = false;
        quoteErrorMessage.value = '';

        if (selectedRoute.value && selectedRoute.value.routeId)
            store.dispatch('bridgeDexAPI/clearRouteTimer', { routeId: selectedRoute.value.routeId });

        unWatchChanges();
        unWatchLoading();
    });

    // ===========================================================================================
    // * Return
    // ===========================================================================================
    return {
        // * Loading
        isQuoteLoading,
        isSrcAmountSet,

        isShowEstimateInfo,

        // * All Fees
        fees: allFees,

        // * Service requests
        makeQuoteRoutes,
        resetQuoteRoutes,

        // ! Errors
        quoteErrorMessage,
    };
};

export default useBridgeDexQuote;
