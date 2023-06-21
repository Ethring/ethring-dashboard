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
        async getAllowance(_, { net, tokenAddress, ownerAddress }) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
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
                url: VUE_APP_DEBRIDGE_API,
                route: 'getApproveTx',
                params: {
                    net,
                    tokenAddress,
                    ownerAddress,
                },
            });
        },

        /* ESTIMATE BRIDGE */
        async estimateBridge(_, { fromNet, fromTokenAddress, amount, toNet, toTokenAddress }) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'estimateBridge',
                params: {
                    fromNet,
                    fromTokenAddress,
                    amount,
                    toNet,
                    toTokenAddress,
                },
            });
        },

        /* GET BRIDGE TX */
        async getBridgeTx(
            _,
            { fromNet, fromTokenAddress, amount, toNet, toTokenAddress, recipientAddress, fallbackAddress, ownerAddress }
        ) {
            return await fetchData({
                url: VUE_APP_DEBRIDGE_API,
                route: 'getBridgeTx',
                params: {
                    fromNet,
                    fromTokenAddress,
                    amount,
                    toNet,
                    toTokenAddress,
                    recipientAddress,
                    fallbackAddress,
                    ownerAddress,
                },
            });
        },
    },
};
