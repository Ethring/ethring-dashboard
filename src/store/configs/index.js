import _ from 'lodash';

import { ECOSYSTEMS } from '@/Adapter/config';
import { getConfigsByEcosystems, getTokensConfigByChain } from '@/api/networks';

const TYPES = {
    SET_CONFIG_LOADING: 'SET_CONFIG_LOADING',
    SET_TOKENS_BY_CHAIN: 'SET_TOKENS_BY_CHAIN',
    SET_CHAIN_CONFIG: 'SET_CHAIN_CONFIG',
};

export default {
    namespaced: true,

    state: () => ({
        isConfigLoading: true,

        chains: {
            [ECOSYSTEMS.EVM]: {},
            [ECOSYSTEMS.COSMOS]: {},
        },

        tokensByChain: {},
    }),

    getters: {
        isConfigLoading: (state) => state.isConfigLoading,

        getConfigsByEcosystems: (state) => (ecosystem) => state.chains[ecosystem] || {},

        getConfigsListByEcosystem: (state) => (ecosystem) => _.values(state.chains[ecosystem]) || [],

        getChainConfigByChainId: (state) => (chainId, ecosystem) => {
            if (!state.chains[ecosystem]) {
                return {};
            }

            const chainList = _.values(state.chains[ecosystem]);

            return chainList.find((chain) => chain.chain_id === chainId) || {};
        },

        tokensByNetwork: (state) => (network) => state.tokensByChain[network] || {},

        getTokenLogoByAddress: (state) => (address, network) => {
            if (!state.tokensByChain[network]) {
                return '';
            }

            const token = state.tokensByChain[network][address] || {};

            return token.logo || '';
        },

        getTokensListForChain: (state) => (network) => {
            if (!state.tokensByChain[network]) {
                return [];
            }

            const tokens = Object.entries(state.tokensByChain[network]).map((tkn) => tkn[1]) || [];
            return _.orderBy(tokens, ['name'], ['asc']);
        },
    },

    mutations: {
        [TYPES.SET_CHAIN_CONFIG](state, { chain, ecosystem, config }) {
            if (!state.chains[ecosystem][chain]) {
                state.chains[ecosystem][chain] = {};
            }

            state.chains[ecosystem][chain] = config;
        },

        [TYPES.SET_TOKENS_BY_CHAIN](state, { chain, tokens }) {
            if (!state.tokensByChain[chain]) {
                state.tokensByChain[chain] = {};
            }

            state.tokensByChain[chain] = tokens;
        },

        [TYPES.SET_CONFIG_LOADING](state, value) {
            state.isConfigLoading = value || false;
        },
    },

    actions: {
        async initConfigs({ dispatch }) {
            await dispatch('initChainsByEcosystems', ECOSYSTEMS.COSMOS);
            await dispatch('initChainsByEcosystems', ECOSYSTEMS.EVM);

            dispatch('setConfigLoading', false);
        },

        async initChainsByEcosystems({ commit, dispatch, state }, ecosystem) {
            const response = await getConfigsByEcosystems(ecosystem);

            for (const chain in response) {
                if (!state.chains[ecosystem][chain]) {
                    commit(TYPES.SET_CHAIN_CONFIG, { chain, ecosystem, config: response[chain] });
                }

                if (!state.tokensByChain[chain]) {
                    dispatch('initTokensByChain', { chain, ecosystem });
                }
            }
        },

        async initTokensByChain({ commit }, { chain, ecosystem }) {
            const response = await getTokensConfigByChain(chain, ecosystem);
            commit(TYPES.SET_TOKENS_BY_CHAIN, { tokens: response, chain });
        },

        setConfigLoading({ commit }, value) {
            commit(TYPES.SET_CONFIG_LOADING, value);
        },
    },
};
