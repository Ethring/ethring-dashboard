import { computed, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { GetAllowanceParams } from '@/modules/bridge-dex/models/Request.type';

import { IQuoteRoute, ErrorResponse } from '@/modules/bridge-dex/models/Response.interface';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import { Allowance } from '@/modules/bridge-dex/models/Request.type';

import { AddressByChainHash } from '@/shared/models/types/Address';

/**
 *
 * @composition useBridgeDexAllowance
 * @description Composition for handling allowance requests for BridgeDex services
 *
 * @howToUse
 * - Get quote routes list by service type (bridge, dex, bridgedex)
 * - Get selected route for service type (bridge, dex, bridgedex)
 * - Get allowance amount of the source token
 *
 * @important This composition is used in the useBridgeDexService composition, ALLOWANCE available only for EVM network
 *
 * @param {ServiceTypes} targetType - The target service type (bridge, dex, bridgedex)
 * @param {BridgeDexService<any>} bridgeDexService - The BridgeDexService instance for the target service type
 *
 * @returns {Object} - Object containing the following:
 *
 * - isAllowanceLoading - A boolean computed ref for the loading state of the allowance request
 * - isNeedApprove - A boolean computed ref for checking if the allowance request needs approval
 *
 * - srcTokenAllowance - A computed ref for the allowance amount of the source token
 * - makeAllowanceRequest - A function for making an allowance request to the service
 *
 */
const useBridgeDexAllowance = (targetType: ServiceTypes, bridgeDexService: BridgeDexService<any>) => {
    const store = useStore();

    const { walletAddress } = useAdapter();

    // ===========================================================================================
    // * Address
    // ===========================================================================================

    const addressByChain = computed<AddressByChainHash>(() => {
        return store.getters['adapters/getAddressesByEcosystem'](Ecosystem.EVM) as AddressByChainHash;
    });

    // ===========================================================================================
    // * Current Service & Route
    // ===========================================================================================
    const selectedRoute = computed<IQuoteRoute>(() => store.getters['bridgeDexAPI/getSelectedRoute'](targetType));

    // ===========================================================================================
    // * Loading
    // ===========================================================================================

    const isAllowanceLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('allowance') || false,
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'allowance', value }),
    });

    // ===========================================================================================
    // * Selected Token and Network
    // ===========================================================================================

    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
    const selectedSrcToken = computed(() => store.getters['tokenOps/srcToken']);
    const srcAmount = computed(() => store.getters['tokenOps/srcAmount']);

    // ===========================================================================================
    // * Validation
    // ===========================================================================================

    const isAllowToMakeRequest = computed(() => {
        const isEVM = selectedSrcNetwork.value && selectedSrcNetwork.value.ecosystem === Ecosystem.EVM;

        const isServiceSelected =
            selectedRoute.value &&
            selectedRoute.value.serviceId &&
            typeof selectedRoute.value.serviceId === 'string' &&
            selectedRoute.value.serviceId !== null;

        const isTokenSelected =
            selectedSrcToken.value &&
            typeof selectedSrcToken.value?.address === 'string' &&
            selectedSrcToken.value.address &&
            selectedSrcToken.value.address !== null;

        if (!isEVM) return false;

        return isEVM && isServiceSelected && isTokenSelected;
    });

    // ===========================================================================================
    // * Allowance
    // ===========================================================================================

    const srcTokenAllowance = computed(() => {
        if (!isAllowToMakeRequest.value) return null;

        if (!selectedSrcToken.value && !selectedSrcToken.value?.address) return null;

        return store.getters['bridgeDexAPI/getServiceAllowance'](
            selectedRoute.value.serviceId,
            addressByChain.value[selectedSrcNetwork.value.net],
            selectedSrcToken.value.address,
        );
    });

    // ===========================================================================================
    // * Allowance -> Check if need to approve
    // ===========================================================================================
    const isNeedApprove = computed(() => {
        if (!selectedSrcToken.value && !selectedSrcToken.value?.address) return false;

        if (!isAllowToMakeRequest.value && !srcAmount.value) return false;

        if (!srcTokenAllowance.value || srcTokenAllowance.value === null) return false;

        return !BigNumber(srcAmount.value).lte(srcTokenAllowance.value);
    });

    // ===========================================================================================
    // * Requests to the Service by ServiceType
    // ===========================================================================================

    const makeAllowanceRequest = async (serviceId: string, requestParams: Allowance) => {
        isAllowanceLoading.value = true;

        const isAddressEmpty = !requestParams.tokenAddress || requestParams.tokenAddress === null;

        if (!isAllowToMakeRequest.value || isAddressEmpty) return (isAllowanceLoading.value = false);

        try {
            bridgeDexService.setServiceId(serviceId);
            const allowance = await bridgeDexService.getAllowance(requestParams as GetAllowanceParams);

            store.dispatch('bridgeDexAPI/setServiceAllowance', {
                serviceId,
                owner: requestParams.ownerAddress,
                token: requestParams.tokenAddress,
                value: allowance,
            });

            return allowance;
        } catch (error) {
            throw error as ErrorResponse;
        } finally {
            isAllowanceLoading.value = false;
        }
    };

    const clearAllowance = async (serviceId: string, requestParams: Allowance) => {
        await store.dispatch('bridgeDexAPI/setServiceAllowance', {
            serviceId,
            owner: requestParams.ownerAddress,
            token: requestParams.tokenAddress,
            value: null,
        });
    };

    // ===========================================================================================
    // * Watchers
    // ===========================================================================================

    // * Watch for selected token and route changes
    // 1. When selected token or route change
    // 2. Check if the request is allowed
    // 3. If allowed, make an allowance request
    const unWatchSrcToken = watch([selectedSrcToken, selectedRoute], async () => {
        if (
            (!isAllowToMakeRequest.value && !isNeedApprove.value) ||
            (srcTokenAllowance.value !== null && srcTokenAllowance.value !== undefined) ||
            selectedRoute.value?.serviceId === null ||
            selectedRoute.value?.serviceId === undefined
        )
            return;

        await makeAllowanceRequest(selectedRoute.value.serviceId, {
            net: selectedSrcNetwork.value.net,
            tokenAddress: selectedSrcToken.value.address,
            ownerAddress: (addressByChain.value[selectedSrcNetwork.value.net] || walletAddress.value) as string,
        });
    });

    // ===========================================================================================
    // * Cleanup
    // ===========================================================================================

    onUnmounted(() => {
        unWatchSrcToken();
    });

    // ===========================================================================================
    // * Return
    // ===========================================================================================
    return {
        // * Loading
        isAllowanceLoading,

        // * Service requests
        makeAllowanceRequest,
        clearAllowance,

        // * Allowance
        isNeedApprove,
        srcTokenAllowance,
    };
};

export default useBridgeDexAllowance;
