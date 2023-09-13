import { getNetworksConfig, getTokensListByNetwork } from '@/api/networks';

const types = {
    SET_SELECTED_NETWORK: 'SET_SELECTED_NETWORK',
    SET_ZOMET_NETWORKS_LIST: 'SET_ZOMET_NETWORKS_LIST',
    SET_BLOCKNATIVE_CHAINS: 'SET_BLOCKNATIVE_CHAINS',
    SET_ZOMET_NETWORKS: 'SET_ZOMET_NETWORKS',
    SET_ZOMET_TOKENS_BY_NET: 'SET_ZOMET_TOKENS_BY_NET',
};

export default {
    namespaced: true,
    state: () => ({
        selectedNetwork: null,
        zometNetworksList: [],
        zometNetworks: {},
        tokensByNetwork: {},
        zometTokens: {},
        tokensAddressesByNet: {},
        chainsForConnect: [],
    }),

    getters: {
        selectedNetwork: (state) => state.selectedNetwork,
        zometNetworksList: (state) => state.zometNetworksList,
        zometNetworks: (state) => state.zometNetworks,
        zometTokens: (state) => state.zometTokens || {},

        networkByChainId: (state) => (chainId) => state.zometNetworksList.find((network) => network.chain_id === chainId) || {},

        tokensByNetwork: (state) => (network) => state.tokensByNetwork[network] || {},

        tokensAddressesByNet: (state) => (network) => state.tokensAddressesByNet[network] || [],
    },

    mutations: {
        [types.SET_SELECTED_NETWORK](state, value) {
            state.selectedNetwork = value;
        },
        [types.SET_ZOMET_NETWORKS_LIST](state, value) {
            state.zometNetworksList = value;
        },
        [types.SET_ZOMET_NETWORKS](state, value) {
            state.zometNetworks = value;
        },
        [types.SET_BLOCKNATIVE_CHAINS](state, value) {
            state.chainsForConnect = value;
        },
        [types.SET_ZOMET_TOKENS_BY_NET](state, { tokens, network } = {}) {
            const exists = JSON.parse(JSON.stringify(state.zometTokens)) || {};

            if (!state.zometTokens[network]) {
                state.zometTokens[network] = {};
            }
            state.tokensByNetwork[network] = tokens;

            const tokensList = Object.keys(tokens);

            state.zometTokens = {
                ...exists,
                ...tokens,
            };

            state.zometNetworks[network].tokens = tokens;

            state.tokensAddressesByNet[network] = tokensList;
        },
    },

    actions: {
        setSelectedNetwork({ commit }, value) {
            commit(types.SET_SELECTED_NETWORK, value);
        },

        async initZometNets({ commit, dispatch }) {
            const response = await getNetworksConfig();
            if (response.status === 200) {
                commit(types.SET_ZOMET_NETWORKS, response.data);

                const nets = [];
                for (const network in response.data) {
                    nets.push(response.data[network]);
                    dispatch('initZometTokens', network);
                }
                commit(types.SET_ZOMET_NETWORKS_LIST, nets);
            }
        },

        async initZometTokens({ commit }, network) {
            if (!network) {
                commit(types.SET_ZOMET_TOKENS_BY_NET, {});
            }

            const response = await getTokensListByNetwork(network);

            if (response.status === 200) {
                commit(types.SET_ZOMET_TOKENS_BY_NET, { tokens: response.data, network });
            }
        },
    },
};
