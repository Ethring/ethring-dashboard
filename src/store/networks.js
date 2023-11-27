import { getNetworksConfig, getTokensListByNetwork } from '@/api/networks';
import _ from 'lodash';

import prices from '@/modules/prices/';

const TYPES = {
    SET_ZOMET_NETWORKS: 'SET_ZOMET_NETWORKS',

    SET_ZOMET_TOKENS_BY_NET: 'SET_ZOMET_TOKENS_BY_NET',

    SET_ZOMET_TOKENS_BY_COSMOS: 'SET_ZOMET_TOKENS_BY_COSMOS',

    SET_ZOMET_NETWORKS_LIST: 'SET_ZOMET_NETWORKS_LIST',

    SET_CONFIG_LOADING: 'SET_CONFIG_LOADING',
};

export default {
    namespaced: true,

    state: () => ({
        isConfigLoading: false,
        selectedNetwork: null,
        zometNetworksList: [],
        zometNetworks: {},
        tokensByNetwork: {},
        zometTokens: {},
        chainsForConnect: [],
    }),

    getters: {
        isConfigLoading: (state) => state.isConfigLoading,

        zometNetworksList: (state) => state.zometNetworksList,
        zometNetworks: (state) => state.zometNetworks,
        zometTokens: (state) => state.zometTokens || {},

        networkByChainId: (state) => (chainId) => state.zometNetworksList.find((network) => network.chain_id === chainId) || {},

        tokensByNetwork: (state) => (network) => state.tokensByNetwork[network] || {},
        getTokensListForChain: (state) => (network) => {
            if (!state.tokensByNetwork[network]) {
                return [];
            }

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
                tokens[token].id = `${network}:asset__${tokens[token].address}:${tokens[token].symbol}`;
                tokens[token].chain = network;
                tokens[token].balance = 0;
                tokens[token].balanceUsd = 0;
            }

            state.tokensByNetwork[network] = tokens;

            state.zometTokens = {
                ...exists,
                ...tokens,
            };
        },

        [TYPES.SET_ZOMET_TOKENS_BY_COSMOS](state, { tokens, network } = {}) {
            if (!state.tokensByNetwork[network]) {
                state.tokensByNetwork[network] = {};
            }

            const cosmosTokens = {};

            for (const token of tokens) {
                if (!token.address && token.base) {
                    token.address = token.base;
                }

                if (token.logo_URIs) {
                    token.logo = token.logo_URIs?.svg || token.logo_URIs?.png || null;
                }

                token.id = `${network}:asset__${token.address}:${token.symbol}`;

                token.chain = network;

                token.balance = 0;
                token.balanceUsd = 0;

                cosmosTokens[token.address] = token;
            }

            state.tokensByNetwork[network] = cosmosTokens;
        },

        [TYPES.SET_CONFIG_LOADING](state, value) {
            state.isConfigLoading = value || false;
        },
    },

    actions: {
        async initZometNets({ commit, dispatch, state }) {
            const response = await getNetworksConfig();

            if (response.status === 200) {
                const nets = [];

                for (const network in response.data) {
                    if (!state.zometNetworks[network]) {
                        const networkData = { network, config: response.data[network] };

                        if (networkData.config.native_token && !networkData.config.native_token?.price) {
                            const info = await prices.Coingecko.marketCapForNativeCoin(networkData.config.native_token.coingecko_id);
                            const { usd = {} } = info;
                            networkData.config.native_token.price = usd.price || 0;
                        }

                        commit(TYPES.SET_ZOMET_NETWORKS, networkData);
                    }

                    if (!state.tokensByNetwork[network]) {
                        dispatch('initZometTokens', network);
                    }

                    nets.push(response.data[network]);
                }

                commit(TYPES.SET_ZOMET_NETWORKS_LIST, Object.values(state.zometNetworks));

                dispatch('setConfigLoading', false);
            }
        },

        setTokensByCosmosNet({ commit }, { network, tokens }) {
            if (!network) {
                commit(TYPES.SET_ZOMET_TOKENS_BY_COSMOS, {});
            }

            commit(TYPES.SET_ZOMET_TOKENS_BY_COSMOS, { tokens, network });
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

        setConfigLoading({ commit }, value) {
            commit(TYPES.SET_CONFIG_LOADING, value);
        },
    },
};
