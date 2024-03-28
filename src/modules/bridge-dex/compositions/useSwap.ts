import { computed } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceType, ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { GetApproveTxParams, GetSwapTxParams, Swap } from '@/modules/bridge-dex/models/Request.type';

import { IQuoteRoute, ErrorResponse } from '@/modules/bridge-dex/models/Response.interface';

import useAdapter from '@/Adapter/compositions/useAdapter';

import { AddressByChain, AddressByChainHash } from '@/shared/models/types/Address';
import { NATIVE_CONTRACT } from '@/Adapter/config';

/**
 *
 * @composition useBridgeDexSwap
 * @description Composition for handling swap requests for BridgeDex services
 *
 * @howToUse
 * -
 *
 * @important This composition is used in the useBridgeDexService composition, SWAP available only for all networks
 *
 * @param {ServiceTypes} targetType - The target service type (bridge, dex, bridgedex)
 * @param {BridgeDexService<any>} bridgeDexService - The BridgeDexService instance for the target service type
 *
 * @returns {Object} - Object containing the following:
 *
 * - isSwapLoading - A boolean computed ref for the loading state of the swap request
 *
 * - makeSwapRequest - A function for making a swap request to the service
 *
 */
const useBridgeDexSwap = (targetType: ServiceTypes, bridgeDexService: BridgeDexService<any>) => {
    const store = useStore();

    const type = ServiceType[targetType];

    // ===========================================================================================
    // * Current Service & Route
    // ===========================================================================================

    const selectedRoute = computed<IQuoteRoute>(() => store.getters['bridgeDexAPI/getSelectedRoute'](targetType));

    // ===========================================================================================
    // * Loading
    // ===========================================================================================

    const isSwapLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('swap'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'swap', value }),
    });

    // ===========================================================================================
    // * Selected Token and Network
    // ===========================================================================================

    const selectedSrcNetwork = computed(() => store.getters['tokenOps/srcNetwork']);
    const selectedSrcToken = computed(() => store.getters['tokenOps/srcToken']);
    const srcAmount = computed(() => store.getters['tokenOps/srcAmount']);

    // ===========================================================================================
    // * Requests to the Service by ServiceType
    // ===========================================================================================

    const makeSwapRequest = async (serviceId: string, requestParams: Swap, { toType }: { toType: ServiceType }) => {
        isSwapLoading.value = true;

        !requestParams.fromToken && (requestParams.fromToken = NATIVE_CONTRACT);
        !requestParams.toToken && (requestParams.toToken = NATIVE_CONTRACT);

        let serviceType = type;

        let service = bridgeDexService as BridgeDexService<typeof serviceType>;

        if (toType) {
            serviceType = ServiceType[toType];
            service = new BridgeDexService<typeof serviceType>(serviceType);
        }

        try {
            service.setServiceId(serviceId);
            return await service.getSwapTx(requestParams as GetSwapTxParams);
        } catch (error) {
            throw error as ErrorResponse;
        } finally {
            isSwapLoading.value = false;
        }
    };

    // ===========================================================================================
    // * Return
    // ===========================================================================================
    return {
        // * Loading
        isSwapLoading,

        // * Service requests
        makeSwapRequest,
    };
};

export default useBridgeDexSwap;
