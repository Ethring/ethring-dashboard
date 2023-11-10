import { getServices, SERVICE_TYPE } from '@/config/services';

import { getAllowance, getApproveTx, getSwapTx, estimateSwap } from '../../../api/services';

const DEFAULT_URL = process.env.VUE_APP_1INCH_SWAP_API;
const DEFAULT_SERVICE_ID = 'swap-1inch';

const TYPES = {
    SET_SERVICE: 'SET_SERVICE',

    SET_BEST_ROUTE: 'SET_BEST_ROUTE',
    SET_SHOW_ROUTES: 'SET_SHOW_ROUTES',
};

export default {
    namespaced: true,
    state: () => ({
        service: getServices(SERVICE_TYPE.SWAP).find((service) => service.id === DEFAULT_SERVICE_ID),
        services: getServices(SERVICE_TYPE.SWAP),

        bestRoute: null,
        showRoutes: false,
    }),

    getters: {
        service: (state) => state.service,

        bestRoute: (state) => state.bestRoute,
        showRoutes: (state) => state.showRoutes,
    },

    mutations: {
        [TYPES.SET_BEST_ROUTE](state, value) {
            state.bestRoute = value;
        },
        [TYPES.SET_SHOW_ROUTES](state, value) {
            state.showRoutes = value;
        },
        [TYPES.SET_SERVICE](state, value) {
            state.service = value;
        },
    },
    actions: {
        setBestRoute({ commit }, value) {
            commit(TYPES.SET_BEST_ROUTE, value);
        },
        setShowRoutes({ commit }, value) {
            commit(TYPES.SET_SHOW_ROUTES, value);
        },
        setService({ commit }, value) {
            commit(TYPES.SET_SERVICE, value);
        },

        // TODO: move to api
        // TODO: remove from store

        /* ESTIMATE SWAP */
        async estimateSwap(_, { url = DEFAULT_URL, net, fromTokenAddress, toTokenAddress, amount, ownerAddress }) {
            return await estimateSwap({
                url,
                net,
                fromTokenAddress,
                toTokenAddress,
                amount,
                ownerAddress,
            });
        },

        /* ALLOWANCE */
        async getAllowance(_, { url = DEFAULT_URL, net, tokenAddress, ownerAddress, store, service } = {}) {
            return await getAllowance({
                url,
                net,
                tokenAddress,
                ownerAddress,
                store,
                service,
            });
        },

        /* APPROVE TX */
        async getApproveTx(_, { url = DEFAULT_URL, net, tokenAddress, ownerAddress }) {
            return await getApproveTx({
                url,
                net,
                tokenAddress,
                ownerAddress,
            });
        },

        /* GET SWAP TX */
        async getSwapTx(_, { url = DEFAULT_URL, net, fromTokenAddress, toTokenAddress, amount, ownerAddress, slippage }) {
            return await getSwapTx({
                url,
                net,
                fromTokenAddress,
                toTokenAddress,
                amount,
                ownerAddress,
                slippage,
            });
        },
    },
};
