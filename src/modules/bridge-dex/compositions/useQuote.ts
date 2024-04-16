import { computed, onUnmounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import BridgeDexService from '@/modules/bridge-dex';
import { ModulesByService, ServiceType, ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { ModuleType } from '@/shared/models/enums/modules.enum';
import { AllQuoteParams } from '@/modules/bridge-dex/models/Request.type';

import { IQuoteRoute, ErrorResponse } from '@/modules/bridge-dex/models/Response.interface';
import { NATIVE_CONTRACT } from '@/Adapter/config';

import { FEE_TYPE } from '@/shared/models/enums/fee.enum';

import { FeeInfo } from '@/shared/models/types/Fee';
import { calculateFeeByCurrency, calculateFeeInNativeToUsd } from '@/shared/calculations/calculate-fee';

import { AddressByChainHash } from '@/shared/models/types/Address';

import logger from '@/shared/logger';
import _ from 'lodash';
import useInputValidation from '@/shared/form-validations';

/**
 *
 * @composition useBridgeDexQuote
 * @description Composition for handling quote requests for BridgeDex services
 *
 * @important This composition is used in the useBridgeDexService composition, QUOTE available for all networks
 *
 * @param {ServiceTypes} targetType - The target service type (bridge, dex, bridgedex)
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
const useBridgeDexQuote = (targetType: ServiceTypes, bridgeDexService: BridgeDexService<any>) => {
    const store = useStore();

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
    } = useInputValidation();

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

        if (srcEcosystem !== dstEcosystem) {
            return {
                ...srcAddressByChain.value,
                ...dstAddressByChain.value,
            };
        }

        return srcAddressByChain.value;
    });

    // ===========================================================================================
    // * Utils
    // ===========================================================================================
    const resetQuoteRoutes = () => {
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

    // ===========================================================================================
    // !Validation
    // ===========================================================================================

    // ?Check if the module is send
    const isSendModule = computed(() => {
        return modules.includes(ModuleType.send) && !isDstTokenChainCorrectSwap.value && !isDstTokenChainCorrect.value;
    });

    // ?Check if the module is super swap
    const isSuperSwapModule = computed(() => {
        const isSame = isSameNetwork.value && isSrcTokenChainCorrect.value && isDstTokenChainCorrectSwap.value;
        const isDifferent = isSrcTokenChainCorrect.value && isDstTokenChainCorrect.value;

        return modules.includes(ModuleType.superSwap) && !isSameToken.value && (isSame || isDifferent) && !isSameTokenSameNet.value;
    });

    // ?Check if the request is allowed
    const isAllowToMakeRequest = computed(() => {
        const isSwap = isSrcTokenChainCorrect.value && isDstTokenChainCorrectSwap.value;

        if (modules.includes(ModuleType.send)) {
            return false;
        } else if (modules.includes(ModuleType.swap) && !isSameToken.value) {
            return isSwap && isSrcAmountSet.value;
        } else if (modules.includes(ModuleType.superSwap)) {
            return isSuperSwapModule.value && isSrcAmountSet.value;
        }

        return isSrcTokenChainCorrect.value && isDstTokenChainCorrect.value && isSrcAmountSet.value;
    });

    const isShowEstimateInfo = computed(() => {
        const mainRequired = isQuoteRouteSet.value && isQuoteRouteSelected.value && isSrcAmountSet.value && isDstAmountSet.value;

        if (isQuoteLoading.value) {
            return true;
        }

        if (quoteErrorMessage.value) {
            return true;
        }

        return mainRequired;
    });

    // ===========================================================================================
    // * Requests to the Service by ServiceType
    // ===========================================================================================

    const makeQuoteRoutes = async (requestParams: AllQuoteParams) => {
        // !If the quote is loading, return
        if (isQuoteLoading.value) {
            return;
        }

        // !If the request is not allowed, return
        if (!isAllowToMakeRequest.value) {
            quoteErrorMessage.value = 'Please select the correct source and destination tokens';
            return (isQuoteLoading.value = false);
        }

        const isDex = serviceType === ServiceType.dex;
        const isSameToken = requestParams.fromToken === requestParams.toToken;

        requestParams.ownerAddresses = addressByChain.value;

        // !If it's a dex and the tokens are the same, return
        if (isDex && isSameToken) {
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

            const { best, routes } = await bridgeDexService.getQuote(requestParams, { withServiceId });

            let selectedRoute = routes.find(({ serviceId }) => serviceId === best);

            // * If there is only one route, set it as selected
            if (routes.length === 1 && !selectedRoute) {
                selectedRoute = routes[0];
            }

            store.dispatch('bridgeDexAPI/setSelectedRoute', {
                serviceType: targetType,
                value: selectedRoute,
            });

            store.dispatch('bridgeDexAPI/setQuoteRoutes', {
                serviceType: targetType,
                value: routes,
            });

            return {
                best,
                routes,
            };
        } catch (error) {
            console.error('useBridgeDexQuote -> makeQuoteRoutes', error);
            quoteErrorMessage.value = error?.message || 'An error occurred while making a quote request';

            resetQuoteRoutes();

            throw error as ErrorResponse;
        } finally {
            isQuoteLoading.value = false;

            if (selectedRoute.value && selectedRoute.value.toAmount) {
                store.dispatch('tokenOps/setDstAmount', selectedRoute.value.toAmount);
            }
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

        if (!fromAmount || !toAmount) {
            return emptyFee.value;
        }

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

        if (isAllowToMakeRequest.value) {
            return rateFee;
        }

        return emptyFee.value;
    });

    const feeInCurrency = computed(() => {
        const { native_token = {} } = selectedSrcNetwork.value || {};
        const { symbol = null, price = 0 } = native_token || 0;

        const { fee = [] } = selectedRoute.value || {};

        if (!fee.length) {
            return '0';
        }

        const usdFee = calculateFeeByCurrency(selectedRoute.value, 'USD');

        const nativeTokenFeeToUsd = calculateFeeInNativeToUsd(selectedRoute.value, { symbol, price });

        const targetFee = nativeTokenFeeToUsd.isZero() ? usdFee : nativeTokenFeeToUsd;

        if (isAllowToMakeRequest.value) {
            return targetFee.toString();
        }

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
            if (isSendModule.value || !isAllowToMakeRequest.value) {
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
                fromToken: selectedSrcToken.value.address,
                toToken: selectedDstToken.value.address,

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
                _.isEqual(
                    { ...params, isReloadRoutes: isReloadRoutes.value, ownerAddresses: {} },
                    { ...oldParams, isReloadRoutes: oldIsReloadRoutes, ownerAddresses: {} },
                )
            ) {
                return;
            }

            try {
                await makeQuoteRoutes(params);
                isReloadRoutes.value && (isReloadRoutes.value = false);

                // _.debounce(async () => {
                //     await makeQuoteRoutes(params);
                // }, 1000)();
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

// const dstAmount = computed(() => store.getters['tokenOps/dstAmount']);

// const prepareFeeInfo = (response) => {
//     // dstAmount.value = BigNumber(response.toTokenAmount).decimalPlaces(6).toString();
//     // // const { estimatedTime = {}, protocolFee = null } = selectedService.value || {};
//     // const { chainId, chain_id, native_token = {} } = selectedSrcNetwork.value || {};
//     // const { symbol = null, price = 0 } = native_token || 0;
//     // // * Rate fee
//     // rateFeeInfo.value = {
//     //     title: 'tokenOperations.rate',
//     //     symbolBetween: '~',
//     //     fromAmount: '1',
//     //     fromSymbol: selectedSrcToken.value.symbol,
//     //     toAmount: formatNumber(response.toTokenAmount / response.fromTokenAmount, 6),
//     //     toSymbol: selectedDstToken.value.symbol,
//     // };
//     // // * Base fee
//     // if (response.fee) {
//     //     baseFeeInfo.value = {
//     //         title: 'tokenOperations.networkFee',
//     //         symbolBetween: '~',
//     //         fromAmount: formatNumber(response.fee.amount),
//     //         fromSymbol: response.fee.currency,
//     //         toAmount: formatNumber(BigNumber(response.fee.amount).multipliedBy(price).toString()),
//     //         toSymbol: '$',
//     //     };
//     // }
//     // if (moduleType === 'bridge' && selectedSrcNetwork.value?.ecosystem === ECOSYSTEMS.EVM) {
//     //     baseFeeInfo.value.title = 'tokenOperations.serviceFee';
//     //     baseFeeInfo.value.toAmount = formatNumber(
//     //         BigNumber(response.fee?.amount).multipliedBy(selectedSrcToken.value?.price).toString(),
//     //     );
//     // }
//     // // * Time
//     // const chain = chainId || chain_id;
//     // if (estimatedTime[chain]) {
//     //     const time = Math.round(estimatedTime[chain] / 60);
//     //     estimateTimeInfo.value = {
//     //         title: 'tokenOperations.time',
//     //         symbolBetween: '<',
//     //         fromAmount: '',
//     //         fromSymbol: '',
//     //         toAmount: time,
//     //         toSymbol: 'min',
//     //     };
//     // }
//     // // * Protocol fee
//     // if (!protocolFee) {
//     //     return;
//     // }
//     // const pFee = protocolFee[chain] || 0;
//     // if (!pFee) {
//     //     return;
//     // }
//     // protocolFeeInfo.value = {
//     //     title: 'tokenOperations.protocolFee',
//     //     symbolBetween: '~',
//     //     fromAmount: pFee,
//     //     fromSymbol: symbol,
//     //     toAmount: BigNumber(pFee).multipliedBy(price).toString(),
//     //     toSymbol: '$',
//     // };
// };
