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
        async estimateSwap(_, { net, fromTokenAddress, toTokenAddress, amount }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'estimateSwap',
                params: {
                    net,
                    fromTokenAddress,
                    toTokenAddress,
                    amount,
                },
            });
        },

        /* ALLOWANCE */
        async getAllowance(_, { net, tokenAddress, ownerAddress }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'getAllowance',
                params: {
                    net,
                    tokenAddress,
                    ownerAddress,
                },
            });
        },

        /* APPROVE TX */
        async getApproveTx(_, { net, tokenAddress, ownerAddress }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
                route: 'getApproveTx',
                params: {
                    net,
                    tokenAddress,
                    ownerAddress,
                },
            });
        },

        /* GET SWAP TX */
        async getSwapTx(_, { net, fromTokenAddress, toTokenAddress, amount, ownerAddress, slippage }) {
            return await fetchData({
                url: VUE_APP_1INCH_SWAP_API,
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
