import { getServices } from '@/api/bridge-dex';

const TYPES = {
    SET_SERVICES: 'SET_SERVICES',
    SET_SHOW_ROUTES: 'SET_SHOW_ROUTES',
    SET_SELECTED_ROUTE: 'SET_SELECTED_ROUTE',
};

export default {
    namespaced: true,
    state: () => ({
        services: [],
        showRoutes: false,
        selectedRoute: null,
    }),

    getters: {
        services: (state) => state.services,
        getServicesByType: (state) => (type) => state.services.filter((service) => service.type === type) || [],

        getServicesByEcosystem: (state) => (namespace) =>
            state.services.filter((service) => service.namespace?.toLowerCase() === namespace?.toLowerCase()) || [],
        showRoutes: (state) => state.showRoutes,
        selectedRoute: (state) => state.selectedRoute,
    },

    mutations: {
        [TYPES.SET_SERVICES](state, value) {
            state.services = value;
        },
        [TYPES.SET_SHOW_ROUTES](state, value) {
            state.showRoutes = value;
        },
        [TYPES.SET_SELECTED_ROUTE](state, value) {
            state.selectedRoute = value;
        },
    },
    actions: {
        setSelectedRoute({ commit }, value) {
            commit(TYPES.SET_SELECTED_ROUTE, value);
        },
        setShowRoutes({ commit }, value) {
            commit(TYPES.SET_SHOW_ROUTES, value);
        },
        async getServices({ commit }) {
            const response = await getServices();

            if (response.length) {
                commit(TYPES.SET_SERVICES, response);
            }
        },
    },
};
