import { fetchData } from '@/api/fetchData';
import axios from 'axios';

const DEFAULT_URL = process.env.VUE_APP_1INCH_SWAP_API;

const types = {
    SET_BEST_ROUTE: 'SET_BEST_ROUTE',
    SET_SHOW_ROUTES: 'SET_SHOW_ROUTES',
};

export default {
    namespaced: true,
    state: () => ({
        bestRoute: null,
        showRoutes: false,
    }),

    getters: {
        bestRoute: (state) => state.bestRoute,
        showRoutes: (state) => state.showRoutes,
    },

    mutations: {
        [types.SET_BEST_ROUTE](state, value) {
            state.bestRoute = value;
        },
        [types.SET_SHOW_ROUTES](state, value) {
            state.showRoutes = value;
        },
    },
    actions: {
        setBestRoute({ commit }, value) {
            commit(types.SET_BEST_ROUTE, value);
        },
        setShowRoutes({ commit }, value) {
            commit(types.SET_SHOW_ROUTES, value);
        },
        /* ESTIMATE SWAP */
        async estimateSwap(_, { url, net, fromTokenAddress, toTokenAddress, amount, ownerAddress }) {
            return await fetchData({
                url: url || DEFAULT_URL,
                route: 'estimateSwap',
                params: {
                    net,
                    fromTokenAddress,
                    toTokenAddress,
                    amount,
                    ownerAddress,
                },
            });
        },

        /* ALLOWANCE */
        async getAllowance(_, { url, net, tokenAddress, ownerAddress }) {
            let response;
            try {
                response = await axios.get(`${url || DEFAULT_URL}getAllowance`, {
                    params: {
                        net,
                        tokenAddress,
                        ownerAddress,
                    },
                });
                return response.data.data;
            } catch (err) {
                return { error: err.response.data.error };
            }
        },

        /* APPROVE TX */
        async getApproveTx(_, { url, net, tokenAddress, ownerAddress }) {
            return await fetchData({
                url: url || DEFAULT_URL,
                route: 'getApproveTx',
                params: {
                    net,
                    tokenAddress,
                    ownerAddress,
                },
            });
        },

        /* GET SWAP TX */
        async getSwapTx(_, { url, net, fromTokenAddress, toTokenAddress, amount, ownerAddress, slippage }) {
            return await fetchData({
                url: url || DEFAULT_URL,
                route: 'getSwapTx',
                params: {
                    net,
                    fromTokenAddress,
                    toTokenAddress,
                    amount,
                    ownerAddress,
                    slippage,
                },
            });
        },
    },
};
