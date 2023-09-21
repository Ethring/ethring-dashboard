import { getNetworksConfig, getTokensListByNetwork } from '@/api/networks';

const TYPES = {
    SET_ZOMET_NETWORKS: 'SET_ZOMET_NETWORKS',

    SET_ZOMET_TOKENS_BY_NET: 'SET_ZOMET_TOKENS_BY_NET',

    SET_ZOMET_NETWORKS_LIST: 'SET_ZOMET_NETWORKS_LIST',
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
        zometNetworksList: (state) => state.zometNetworksList,
        zometNetworks: (state) => state.zometNetworks,
        zometTokens: (state) => state.zometTokens || {},

        networkByChainId: (state) => (chainId) => state.zometNetworksList.find((network) => network.chain_id === chainId) || {},

        tokensByNetwork: (state) => (network) => state.tokensByNetwork[network] || {},

        tokensAddressesByNet: (state) => (network) => state.tokensAddressesByNet[network] || [],
    },

    mutations: {
        [TYPES.SET_ZOMET_NETWORKS_LIST](state, value) {
            state.zometNetworksList = value;
        },

        [TYPES.SET_ZOMET_NETWORKS](state, { network, config }) {
            if (!state.zometNetworks[network]) {
                state.zometNetworks[network] = {};
            }

            state.zometNetworks[network] = config;
        },

        [TYPES.SET_ZOMET_TOKENS_BY_NET](state, { tokens, network } = {}) {
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
        async initZometNets({ commit, dispatch, state }) {
            const response = await getNetworksConfig();

            if (response.status === 200) {
                const nets = [];

                for (const network in response.data) {
                    if (!state.zometNetworks[network]) {
                        commit(TYPES.SET_ZOMET_NETWORKS, { network, config: response.data[network] });
                    }

                    if (!state.tokensByNetwork[network]) {
                        dispatch('initZometTokens', network);
                    }

                    nets.push(response.data[network]);
                }

                commit(TYPES.SET_ZOMET_NETWORKS_LIST, Object.values(state.zometNetworks));
            }
        },

        async initZometTokens({ commit }, network) {
            if (!network) {
                commit(TYPES.SET_ZOMET_TOKENS_BY_NET, {});
            }

            const response = await getTokensListByNetwork(network);

            if (response.status === 200) {
                commit(TYPES.SET_ZOMET_TOKENS_BY_NET, { tokens: response.data, network });
            }
        },
    },
};
