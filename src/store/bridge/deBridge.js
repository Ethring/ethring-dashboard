import { fetchData } from '@/api/fetchData';

const VUE_APP_DEBRIDGE_API = process.env.VUE_APP_DEBRIDGE_API;

const types = {
    SET_SUPPORTED_CHAINS: 'SET_SUPPORTED_CHAINS',
    SET_TOKENS_BY_CHAINID: 'SET_TOKENS_BY_CHAINID',
};

export default {
    namespaced: true,
    state: () => ({
        supportedChains: [],
        tokensByChainID: [],
    }),

    getters: {
        supportedChains: (state) => state.supportedChains,
        tokensByChainID: (state) => state.tokensByChainID,
    },

    mutations: {
        [types.SET_SUPPORTED_CHAINS](state, value) {
            state.supportedChains = value;
        },
        [types.SET_TOKENS_BY_CHAINID](state, value) {
            state.tokensByChainID = value;
        },
    },

    actions: {
        /* GET SUPPORTED CHAINS */
        async getSupportedChains({ commit }) {
            const res = await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getSupportedChains',
            });
            commit(types.SET_SUPPORTED_CHAINS, res);
        },

        /* GET TOKENS BY CHAIN ID */
        async getTokensByChain(_, { chainId }) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getTokensByChain',
                params: {
                    chainId,
                },
            });
            // commit(types.SET_TOKENS_BY_CHAINID, res)
        },

        /* ALLOWANCE */
        async getAllowance(_, { net, tokenAddress, owner }) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getAllowance',
                params: {
                    net,
                    tokenAddress,
                    owner,
                },
            });
        },

        /* APPROVE TX */
        async getApproveTx(_, { net, tokenAddress, owner }) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getApproveTx',
                params: {
                    net,
                    tokenAddress,
                    owner,
                },
            });
        },

        /* ESTIMATE BRIDGE */
        async estimateBridge(_, { srcNet, srcTokenAddress, srcTokenAmount, dstNet, dstTokenAddress }) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'estimateBridge',
                params: {
                    srcNet,
                    srcTokenAddress,
                    srcTokenAmount,
                    dstNet,
                    dstTokenAddress,
                },
            });
        },

        /* GET BRIDGE TX */
        async getBridgeTx(
            _,
            { srcNet, srcTokenAddress, srcTokenAmount, dstNet, dstTokenAddress, dstChainRecipientAddress, dstChainFallbackAddress }
        ) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getBridgeTx',
                params: {
                    srcNet,
                    srcTokenAddress,
                    srcTokenAmount,
                    dstNet,
                    dstTokenAddress,
                    dstChainRecipientAddress,
                    dstChainFallbackAddress,
                },
            });
        },
    },
};
