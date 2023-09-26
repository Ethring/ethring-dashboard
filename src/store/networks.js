import { getNetworksConfig, getTokensListByNetwork } from '@/api/networks';
import _ from 'lodash';

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
        chainsForConnect: [],
    }),

    getters: {
        zometNetworksList: (state) => state.zometNetworksList,
        zometNetworks: (state) => state.zometNetworks,
        zometTokens: (state) => state.zometTokens || {},

        networkByChainId: (state) => (chainId) => state.zometNetworksList.find((network) => network.chain_id === chainId) || {},

        tokensByNetwork: (state) => (network) => state.tokensByNetwork[network] || {},
        getTokensListForChain: (state) => (network) => {
            const tokens = Object.entries(state.tokensByNetwork[network]).map((tkn) => tkn[1]) || [];
            return _.sortBy(tokens, ['name']);
        },
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

            for (const token in tokens) {
                // tokens[token].id = `${network}_${token}_${tokens[token].symbol}`;
                tokens[token].chain = network;
                tokens[token].balance = 0;
                tokens[token].balanceUsd = 0;
                tokens[token].code = tokens[token].symbol;
            }

            state.tokensByNetwork[network] = tokens;

            state.zometTokens = {
                ...exists,
                ...tokens,
            };
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
