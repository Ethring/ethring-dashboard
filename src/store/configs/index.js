import _ from 'lodash';

import { ECOSYSTEMS } from '@/Adapter/config';

import { getConfigsByEcosystems, getTokensConfigByChain } from '@/modules/chain-configs/api';

import IndexedDBService from '@/services/indexed-db';

import { DB_TABLES } from '@/shared/constants/indexedDb';

import { DP_CHAINS } from '@/modules/balance-provider/models/enums';

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

            let cId = chainId;

            if (typeof chainId === 'string' && chainId.startsWith('0x')) {
                cId = parseInt(chainId, 16);
            }

            const chain = chainList.find((chain) => chain.chain_id === cId);

            return chain || {};
        },

        getChainLogoByNet: (state) => (net) => {
            for (const ecosystem in state.chains) {
                for (const chain in state.chains[ecosystem]) {
                    if (state.chains[ecosystem][chain].net === net) {
                        return state.chains[ecosystem][chain].logo;
                    }
                }
            }
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

                if (Object.values(DP_CHAINS).includes(chain)) {
                    dispatch('initTokensByChain', { chain, ecosystem });
                }
            }
        },

        async initTokensByChain({}, { chain, ecosystem }) {
            await getTokensConfigByChain(chain, ecosystem);
        },

        async getTokensListForChain({}, chain) {
            const list = await configsDB.getAllObjectFrom(DB_TABLES.TOKENS, 'chain', chain, { isArray: true });
            return _.orderBy(list, ['name'], ['asc']).map((item) => {
                if (item.ecosystem === ECOSYSTEMS.COSMOS) return item;
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
    },
};
