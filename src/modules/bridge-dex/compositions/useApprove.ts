import { computed } from 'vue';
import { useStore, Store } from 'vuex';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceTypes } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { Approve, GetApproveTxParams } from '@/modules/bridge-dex/models/Request.type';

import { ErrorResponse } from '@/modules/bridge-dex/models/Response.interface';

/**
 *
 * @composition useBridgeDexApprove
 * @description Composition for handling approve requests for BridgeDex services
 *
 * @howToUse
 * - Get quote routes list by service type (bridge, dex, bridgedex)
 * - Get selected route for service type (bridge, dex, bridgedex)
 * - Get allowance amount of the source token
 * - Check if the allowance request needs approval
 * - Make an approve request to the service
 * - Get approve transaction/transactions for the token requested for the service
 *
 * @important This composition is used in the useBridgeDexService composition, ALLOWANCE -> APPROVE available only for EVM network
 *
 * @param {ServiceTypes} targetType - The target service type (bridge, dex, bridgedex)
 * @param {BridgeDexService<any>} bridgeDexService - The BridgeDexService instance for the target service type
 *
 * @returns {Object} - Object containing the following:
 *
 * - isApproveLoading - A boolean computed ref for the loading state of the approve request
 * - makeApproveRequest - A function for making an approve request to the service
 *
 */
const useBridgeDexApprove = (
    targetType: ServiceTypes,
    bridgeDexService: BridgeDexService<any>,
    { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null },
) => {
    const store = process.env.NODE_ENV === 'test' ? (tmpStore as Store<any>) : useStore();

    // ===========================================================================================
    // * Loading
    // ===========================================================================================

    const isApproveLoading = computed({
        get: () => store.getters['bridgeDexAPI/getLoaderState']('approve'),
        set: (value) => store.dispatch('bridgeDexAPI/setLoaderStateByType', { type: 'approve', value }),
    });

    // ===========================================================================================
    // * Requests to the Service by ServiceType
    // ===========================================================================================

    const makeApproveRequest = async (serviceId: string, requestParams: Approve) => {
        isApproveLoading.value = true;

        try {
            bridgeDexService.setServiceId(serviceId);
            const approveTx = await bridgeDexService.getApproveTx(requestParams as GetApproveTxParams);

            return approveTx;
        } catch (error) {
            throw error as ErrorResponse;
        } finally {
            isApproveLoading.value = false;
        }
    };

    // ===========================================================================================
    // * Return
    // ===========================================================================================
    return {
        // * Loading
        isApproveLoading,

        // * Service requests
        makeApproveRequest,
    };
};

export default useBridgeDexApprove;
