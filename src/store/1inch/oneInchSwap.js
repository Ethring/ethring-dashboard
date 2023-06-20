import { fetchData } from '@/api/fetchData';

// const types = {};
const VUE_APP_1INCH_SWAP_API = process.env.VUE_APP_1INCH_SWAP_API;

export default {
    namespaced: true,
    state: () => ({}),

    getters: {},

    mutations: {},

    actions: {
        /* ESTIMATE SWAP */
        async estimateSwap(_, { net, from_token_address, to_token_address, amount }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'estimateSwap',
                params: {
                    net,
                    from_token_address,
                    to_token_address,
                    amount,
                },
            });
        },

        /* ALLOWANCE */
        async getAllowance(_, { net, token_address, owner }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'getAllowance',
                params: {
                    net,
                    token_address,
                    owner,
                },
            });
        },

        /* APPROVE TX */
        async getApproveTx(_, { net, token_address, owner }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'getApproveTx',
                params: {
                    net,
                    token_address,
                    owner,
                },
            });
        },

        /* GET SWAP TX */
        async getSwapTx(_, { net, from_token_address, to_token_address, amount, owner, slippage }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'getSwapTx',
                params: {
                    net,
                    from_token_address,
                    to_token_address,
                    amount,
                    owner,
                    slippage,
                },
            });
        },
    },
};
