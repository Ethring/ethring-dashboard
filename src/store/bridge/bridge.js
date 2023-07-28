import { fetchData } from '@/api/fetchData';
import axios from 'axios';

const DEFAULT_URL = process.env.VUE_APP_DEBRIDGE_API;

const types = {
    SET_SUPPORTED_CHAINS: 'SET_SUPPORTED_CHAINS',
    SET_SRC_NETWORKS: 'SET_SRC_NETWORKS',
    SET_DST_NETWORKS: 'SET_DST_NETWORKS',
    SET_TOKENS_BY_CHAINID: 'SET_TOKENS_BY_CHAINID',
    SET_TOKENS_BY_SERVICE: 'SET_TOKENS_BY_SERVICE',
};

export default {
    namespaced: true,
    state: () => ({
        supportedChains: [],
        tokensByChainID: [],
        selectedSrcNetwork: null,
        selectedDstNetwork: null,
        tokensByService: {},
    }),

    getters: {
        supportedChains: (state) => state.supportedChains,
        tokensByChainID: (state) => state.tokensByChainID,
        selectedSrcNetwork: (state) => state.selectedSrcNetwork,
        selectedDstNetwork: (state) => state.selectedDstNetwork,
        tokensByService: (state) => state.tokensByService,
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
        [types.SET_TOKENS_BY_SERVICE](state, value) {
            state.tokensByService = value;
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
        async getSupportedChains({ commit }, url) {
            const res = await fetchData({
                url: url || DEFAULT_URL,
                route: 'getSupportedChains',
            });
            commit(types.SET_SUPPORTED_CHAINS, res);
        },

        /* SET TOKENS BY SERVICE */
        setTokensByChain({ commit }, tokens) {
            commit(types.SET_TOKENS_BY_SERVICE, tokens);
        },

        /* GET TOKENS BY CHAIN ID */
        async getTokensByChain({ commit }, { chainId, url }) {
            const tokens = await fetchData({
                url: url || DEFAULT_URL,
                route: 'getTokensByChain',
                params: {
                    chainId,
                },
            });
            commit(types.SET_TOKENS_BY_CHAINID, tokens);
            return tokens;
        },

        /* ALLOWANCE */
        async getAllowance(_, { net, tokenAddress, ownerAddress, url }) {
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
        async getApproveTx(_, { net, tokenAddress, ownerAddress, url }) {
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

        /* ESTIMATE BRIDGE */
        async estimateBridge(_, { fromNet, fromTokenAddress, amount, toNet, toTokenAddress, url }) {
            let response;
            try {
                response = await axios.get(`${url || DEFAULT_URL}estimateBridge`, {
                    params: {
                        fromNet,
                        fromTokenAddress,
                        amount,
                        toNet,
                        toTokenAddress,
                    },
                });
                return response.data.data;
            } catch (err) {
                return { error: err.response.data.error };
            }
        },

        /* GET BRIDGE TX */
        async getBridgeTx(
            _,
            { fromNet, fromTokenAddress, amount, toNet, toTokenAddress, recipientAddress, fallbackAddress, ownerAddress, url }
        ) {
            return await fetchData({
                url: url || DEFAULT_URL,
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
