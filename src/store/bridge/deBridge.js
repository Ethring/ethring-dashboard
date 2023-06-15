import { fetchData } from '@/api/fetchData';

const VUE_APP_DEBRIDGE_API = process.env.VUE_APP_DEBRIDGE_API;

const types = {
    SET_SUPPORTED_CHAINS: 'SET_SUPPORTED_CHAINS',
    SET_SRC_NETWORKS: 'SET_SRC_NETWORKS',
    SET_DST_NETWORKS: 'SET_DST_NETWORKS',
    SET_TOKENS_BY_CHAINID: 'SET_TOKENS_BY_CHAINID',
};

export default {
    namespaced: true,
    state: () => ({
        supportedChains: [],
        tokensByChainID: [],
        selectedSrcNetwork: null,
        selectedDstNetwork: null,
    }),

    getters: {
        supportedChains: (state) => state.supportedChains,
        tokensByChainID: (state) => state.tokensByChainID,
        selectedSrcNetwork: (state) => state.selectedSrcNetwork,
        selectedDstNetwork: (state) => state.selectedDstNetwork,
    },

    mutations: {
        [types.SET_SUPPORTED_CHAINS](state, value) {
            state.supportedChains = value;
        },
        [types.SET_TOKENS_BY_CHAINID](state, value) {
            state.tokensByChainID = value;
        },
        [types.SET_SRC_NETWORKS](state, value) {
            state.selectedSrcNetwork = value;
        },
        [types.SET_DST_NETWORKS](state, value) {
            state.selectedDstNetwork = value;
        },
    },

    actions: {
        setSelectedSrcNetwork({ commit }, value) {
            commit(types.SET_SRC_NETWORKS, value);
        },
        setSelectedDstNetwork({ commit }, value) {
            commit(types.SET_DST_NETWORKS, value);
        },
        /* GET SUPPORTED CHAINS */
        async getSupportedChains({ commit }) {
            const res = await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getSupportedChains',
            });
            commit(types.SET_SUPPORTED_CHAINS, res);
        },

        /* GET TOKENS BY CHAIN ID */
        async getTokensByChain({ commit }, { chainId }) {
            const tokens = await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getTokensByChain',
                params: {
                    chainId,
                },
            });
            commit(types.SET_TOKENS_BY_CHAINID, tokens);
            return tokens;
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
            { srcNet, srcTokenAddress, srcTokenAmount, dstNet, dstTokenAddress, dstChainRecipientAddress, dstChainFallbackAddress, owner }
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
                    owner,
                },
            });
        },
    },
};
