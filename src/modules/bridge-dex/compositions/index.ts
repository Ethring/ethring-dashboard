import { computed, onMounted, onUnmounted } from 'vue';
import { useStore, Store } from 'vuex';

import BridgeDexService from '@/modules/bridge-dex';
import { ServiceType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { ModuleTypes } from '@/shared/models/enums/modules.enum';

import { IQuoteRoute } from '@/modules/bridge-dex/models/Response.interface';
import { ServiceByModule } from '../enums/ServiceType.enum';

// * Compositions
import useQuote from './useQuote';
import useAllowance from './useAllowance';
import useApprove from './useApprove';
import useSwap from './useSwap';

/**
 *
 * @composition useBridgeDexService
 * @description Composition for handling all requests for BridgeDex services
 *
 * @param {ModuleType} type - The target module type (swap, bridge, superSwap)
 *
 * @returns {Object} - Object containing the following:
 *
 * - quoteRoutes - Quote Routes List by ServiceType (bridge, dex, bridgedex)
 * - selectedRoute - Selected Route for ServiceType (bridge, dex, bridgedex)
 *
 * - all methods and variables from useQuote, useAllowance, useApprove compositions
 *
 */
const useBridgeDexService = (type: ModuleTypes, { tmpStore }: { tmpStore: Store<any> | null } = { tmpStore: null }) => {
    const typeByModule = ServiceByModule[type]; // * ServiceType by ModuleType (swap = dex, bridge = bridge, superSwap = bridgedex);
    const TARGET_TYPE = ServiceType[typeByModule]; // * Target service type (bridge, dex, bridgedex)
    const bridgeDexService = new BridgeDexService(TARGET_TYPE); // * BridgeDexService instance for the target service type

    const store = process.env.NODE_ENV === 'test' ? (tmpStore as Store<any>) : useStore();

    // ===========================================================================================
    // * Quote Routes List by ServiceType (bridge, dex, bridgedex)
    // ===========================================================================================

    const quoteRoutes = computed<IQuoteRoute[]>(() => store.getters['bridgeDexAPI/getQuoteRouteList'](TARGET_TYPE));
    const selectedRoute = computed<IQuoteRoute>(() => store.getters['bridgeDexAPI/getSelectedRoute'](TARGET_TYPE));

    const otherRoutes = computed<IQuoteRoute[]>(() => {
        if (!quoteRoutes.value || !selectedRoute.value) return [];
        return quoteRoutes.value.filter((route: IQuoteRoute) => route.serviceId !== selectedRoute.value.serviceId);
    });

    // ===========================================================================================
    // * Reset selected route on mount
    // ===========================================================================================
    onMounted(() => {
        if (!TARGET_TYPE) return store.dispatch('bridgeDexAPI/setTargetServiceType', null);
        store.dispatch('bridgeDexAPI/setTargetServiceType', TARGET_TYPE);
        store.dispatch('bridgeDexAPI/resetSelectedRoute', { serviceType: TARGET_TYPE });
    });

    onUnmounted(() => {
        if (!TARGET_TYPE) return store.dispatch('bridgeDexAPI/setTargetServiceType', null);
        store.dispatch('bridgeDexAPI/setTargetServiceType', TARGET_TYPE);
        store.dispatch('bridgeDexAPI/resetSelectedRoute', { serviceType: TARGET_TYPE });
    });

    // ===========================================================================================
    // * Return
    // ===========================================================================================
    return {
        // * Routes
        quoteRoutes, // Quote Routes List by ServiceType (bridge, dex, bridgedex)
        otherRoutes, // Other Routes List by ServiceType (bridge, dex, bridgedex)

        selectedRoute, // Selected Route for ServiceType (bridge, dex, bridgedex)

        // * Service variables and methods for Quote, Allowance, Approve, Swap
        ...useQuote(TARGET_TYPE, bridgeDexService, { tmpStore: store }),
        ...useAllowance(TARGET_TYPE, bridgeDexService, { tmpStore: store }),
        ...useApprove(TARGET_TYPE, bridgeDexService, { tmpStore: store }),
        ...useSwap(TARGET_TYPE, bridgeDexService, { tmpStore: store }),
    };
};

export default useBridgeDexService;
