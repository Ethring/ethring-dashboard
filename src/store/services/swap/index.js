import { getServices, SERVICE_TYPE } from '@/config/services';

import { getAllowance, getApproveTx, getSwapTx, estimateSwap } from '@/api/services';

const DEFAULT_URL = process.env.VUE_APP_PARASWAP_API;
const DEFAULT_SERVICE_ID = 'swap-paraswap';

const TYPES = {
    SET_SERVICE: 'SET_SERVICE',
};

export default {
    namespaced: true,
    state: () => ({
        service: getServices(SERVICE_TYPE.SWAP).find((service) => service.id === DEFAULT_SERVICE_ID),
        services: getServices(SERVICE_TYPE.SWAP),
    }),
    getters: {
        service: (state) => state.service,
    },
    mutations: {
        [TYPES.SET_SERVICE](state, value) {
            state.service = value;
        },
    },
    actions: {
        setService({ commit }, value) {
            commit(TYPES.SET_SERVICE, value);
        },

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
