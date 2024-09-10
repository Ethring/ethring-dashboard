import { computed } from 'vue';
import { useStore, Store } from 'vuex';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceType, ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { GetSwapTxParams, Swap } from '@/modules/bridge-dex/models/Request.type';

import { ErrorResponse } from '@/modules/bridge-dex/models/Response.interface';
import { NATIVE_CONTRACT } from '@/core/wallet-adapter/config';

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
const useBridgeDexSwap = (
    targetType: ServiceTypes,
    bridgeDexService: BridgeDexService<any>,
    { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null },
) => {
    const store = tmpStore || useStore();

    const type = ServiceType[targetType];

    // ===========================================================================================
    // * Loading
    // ===========================================================================================

    const isSwapLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('swap'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'swap', value }),
    });

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
