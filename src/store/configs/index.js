import _ from 'lodash';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import { getConfigsByEcosystems, getLastUpdated, getTokensConfigByChain } from '@/modules/chain-configs/api';

import IndexedDBService from '@/services/indexed-db';

import { DB_TABLES } from '@/shared/constants/indexedDb';

import { DP_CHAINS } from '@/core/balance-provider/models/enums';

const TYPES = {
    SET_CONFIG_LOADING: 'SET_CONFIG_LOADING',
    SET_TOKENS_BY_CHAIN: 'SET_TOKENS_BY_CHAIN',
    SET_CHAIN_CONFIG: 'SET_CHAIN_CONFIG',
    SET_LAST_UPDATED: 'SET_LAST_UPDATED',
};

const configsDB = new IndexedDBService('configs');

export default {
    namespaced: true,

    state: () => ({
        isConfigLoading: true,

        chains: {
            [Ecosystem.EVM]: {},
            [Ecosystem.COSMOS]: {},
        },

        lastUpdated: null,
    }),

    getters: {
        isConfigLoading: (state) => state.isConfigLoading,

        getConfigsByEcosystems: (state) => (ecosystem) => state.chains[ecosystem] || {},

        getConfigsListByEcosystem: (state) => (ecosystem) => _.values(state.chains[ecosystem]) || [],

        getChainConfigByChainId: (state) => (chainId, ecosystem) => {
            if (!state.chains[ecosystem]) return {};

            const chainList = _.values(state.chains[ecosystem]);

            let cId = chainId;

            if (typeof chainId === 'string' && chainId.startsWith('0x')) cId = parseInt(chainId, 16);

            const chain = chainList.find((chain) => chain.chain_id === cId);

            return chain || {};
        },

        getChainConfigByChainOrNet: (state) => (chainOrNet, ecosystem) => {
            if (!state.chains[ecosystem]) return {};

            const chainList = _.values(state.chains[ecosystem]);

            const chain = chainList.find((chain) => chain.chain === chainOrNet || chain.net === chainOrNet);

            return chain || {};
        },

        getChainLogoByNet: (state) => (net) => {
            for (const ecosystem in state.chains)
                for (const chain in state.chains[ecosystem])
                    if (state.chains[ecosystem][chain].net === net) return state.chains[ecosystem][chain].logo;
        },

        getNativeTokenByChain: (state) => (chain, ecosystem) => {
            if (!state.chains[ecosystem][chain]) return {};

            if (!state.chains[ecosystem][chain].native_token) return {};

            return state.chains[ecosystem][chain].native_token || {};
        },
    },

    mutations: {
        [TYPES.SET_CHAIN_CONFIG](state, { chain, ecosystem, config }) {
            if (!state.chains[ecosystem][chain]) state.chains[ecosystem][chain] = {};

            state.chains[ecosystem][chain] = config;
        },

        [TYPES.SET_TOKENS_BY_CHAIN](state, { chain, tokens }) {
            if (!state.tokensByChain[chain]) state.tokensByChain[chain] = {};

            state.tokensByChain[chain] = tokens;
        },

        [TYPES.SET_CONFIG_LOADING](state, value) {
            state.isConfigLoading = value || false;
        },

        [TYPES.SET_LAST_UPDATED](state, lastUpdated) {
            state.lastUpdated = lastUpdated;
        },
    },

    actions: {
        async initConfigs({ dispatch }) {
            await Promise.all([dispatch('initChainsByEcosystems', Ecosystem.COSMOS), dispatch('initChainsByEcosystems', Ecosystem.EVM)]);
        },

        async initChainsByEcosystems({ commit, dispatch, state }, ecosystem) {
            const response = await getConfigsByEcosystems(ecosystem, { lastUpdated: state.lastUpdated });

            for (const chain in response) {
                if (!state.chains[ecosystem][chain]) commit(TYPES.SET_CHAIN_CONFIG, { chain, ecosystem, config: response[chain] });

                if (Object.values(DP_CHAINS).includes(chain))
                    dispatch('initTokensByChain', { chain, ecosystem, lastUpdated: state.lastUpdated });
            }
        },

        async initTokensByChain({}, { chain, ecosystem, lastUpdated }) {
            await getTokensConfigByChain(chain, ecosystem, { lastUpdated });
        },

        async getTokensListForChain({}, chain) {
            const list = await configsDB.getAllObjectFrom(DB_TABLES.TOKENS, 'chain', chain, { isArray: true });
            return _.orderBy(list, ['name'], ['asc']).map((item) => {
                if (item.ecosystem === Ecosystem.COSMOS) return item;
                if (item.id && item.id.includes('tokens__')) {
                    const [chain, prefixAddress, symbol] = item.id.split(':');

                    const [prefix, address] = prefixAddress.split('__');

                    const lowerCaseAddress = address.toLowerCase();

                    item.id = `${chain}:${prefix}__${lowerCaseAddress}:${symbol}`;
                }
                if (item.address) item.address = item.address.toLowerCase();
                return item;
            });
        },

        setConfigLoading({ commit }, value) {
            commit(TYPES.SET_CONFIG_LOADING, value);
        },

        async setLastUpdated({ commit }) {
            const lastUpdated = await getLastUpdated();

            commit(TYPES.SET_LAST_UPDATED, lastUpdated);
        },
    },
};
