import _ from 'lodash';

import { ECOSYSTEMS } from '@/Adapter/config';

import { getConfigsByEcosystems, getTokensConfigByChain } from '@/api/networks';

import IndexedDBService from '@/modules/IndexedDb-v2';

import { DB_TABLES } from '@/shared/constants/indexedDb';

const TYPES = {
    SET_CONFIG_LOADING: 'SET_CONFIG_LOADING',
    SET_TOKENS_BY_CHAIN: 'SET_TOKENS_BY_CHAIN',
    SET_CHAIN_CONFIG: 'SET_CHAIN_CONFIG',
};

const configsDB = new IndexedDBService('configs');

export default {
    namespaced: true,

    state: () => ({
        isConfigLoading: true,

        chains: {
            [ECOSYSTEMS.EVM]: {},
            [ECOSYSTEMS.COSMOS]: {},
        },
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
        },

        async initChainsByEcosystems({ commit, dispatch, state }, ecosystem) {
            const response = await getConfigsByEcosystems(ecosystem);

            for (const chain in response) {
                if (!state.chains[ecosystem][chain]) {
                    commit(TYPES.SET_CHAIN_CONFIG, { chain, ecosystem, config: response[chain] });
                }

                dispatch('initTokensByChain', { chain, ecosystem });
            }
        },

        async initTokensByChain(_, { chain, ecosystem }) {
            await getTokensConfigByChain(chain, ecosystem);
        },

        async getTokensListForChain(_, chain) {
            return await configsDB.getAllObjectFrom(DB_TABLES.TOKENS, 'chain', chain, { isArray: true });
        },

        setConfigLoading({ commit }, value) {
            commit(TYPES.SET_CONFIG_LOADING, value);
        },
    },
};
