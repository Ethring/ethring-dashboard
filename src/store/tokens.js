import _ from 'lodash';

import BigNumber from 'bignumber.js';

import { getTotalBalance, getIntegrationsBalance } from '@/modules/balance-provider/calculation';

import IndexedDBService from '@/services/indexed-db';

const balancesDB = new IndexedDBService('balances', 1);

const BALANCE_ALLOW_TYPES = ['tokens', 'integrations'];

const TYPES = {
    SET_DATA_FOR: 'SET_DATA_FOR',

    SET_IS_INIT_CALLED: 'SET_IS_INIT_CALLED',

    SET_LOADER: 'SET_LOADER',

    SET_SELECT_TYPE: 'SET_SELECT_TYPE',

    SET_DISABLE_LOADER: 'SET_DISABLE_LOADER',

    SET_ASSETS_BALANCE: 'SET_ASSETS_BALANCE',
    SET_NATIVE_ASSET: 'SET_NATIVE_ASSET',

    SET_LOADING_BY_CHAIN: 'SET_LOADING_BY_CHAIN',

    SET_TOTAL_BALANCE: 'SET_TOTAL_BALANCE',

    CALCULATE_BALANCE_BY_TYPE: 'CALCULATE_BALANCE_BY_TYPE',

    REMOVE_FROM_LIST_BY_ID: 'REMOVE_FROM_LIST_BY_ID',
};

export default {
    namespaced: true,

    state: () => ({
        isInitCalled: {},
        loadingByChain: {},
        loader: false,
        tokens: {},
        nativeTokens: {},
        disableLoader: false,
        integrations: {},
        nfts: {},
        assetsBalances: {},
        totalBalances: {},
    }),

    getters: {
        isInitCalled: (state) => (account) => state.isInitCalled[account] || null,
        loader: (state) => {
            if (JSON.stringify(state.loadingByChain) === '{}') {
                return false;
            }

            for (const account in state.loadingByChain) {
                if (!state.loadingByChain[account]) {
                    return false;
                }
                for (const chain in state.loadingByChain[account]) {
                    if (state.loadingByChain[account][chain]) {
                        return true;
                    }
                }
            }

            return false;
        },

        loadingByAccount: (state) => (account) => {
            if (JSON.stringify(state.loadingByChain) === '{}') {
                return false;
            }

            if (!account) {
                return false;
            }

            if (!state.loadingByChain[account]) {
                return false;
            }

            for (const chain in state.loadingByChain[account]) {
                if (state.loadingByChain[account][chain]) {
                    return true;
                }
            }

            return false;
        },

        loadingByChain: (state) => (account, chain) => state.loadingByChain[account]?.[chain] || false,

        loadingForChains: (state) => (account) => state.loadingByChain[account] || {},

        getAccountBalanceByType: (state) => (account, type) => {
            if (!state[type]) {
                return [];
            }

            if (!state[type][account]) {
                return [];
            }

            if (!state[type][account] && account !== 'all') {
                return [];
            }

            // TODO: Add support for 'all' account (bundles of all accounts balances)
            // if (account === 'all') {}

            const allForAccount = _.flatMap(state[type][account]) || [];
            return allForAccount;
        },

        integrations: (state) => state.integrations,
        nfts: (state) => state.nfts,

        nativeTokens: (state) => state.nativeTokens,

        getTokensListForChain:
            (state) =>
            (chain, { account = null } = {}) => {
                if (!state.tokens[account] || !chain) {
                    return [];
                }

                return state.tokens[account][chain] || [];
            },

        getNativeTokenForChain: (state) => (account, chain) => {
            if (!state.nativeTokens[account] || !state.nativeTokens[account][chain]) {
                return null;
            }

            return state.nativeTokens[account][chain] || null;
        },

        disableLoader: (state) => state.disableLoader,
        assetsBalances: (state) => state.assetsBalances,
        totalBalances: (state) => state.totalBalances,

        getTokenBySymbol: (state) => (account, symbol) => {
            if (!state.tokens[account]) {
                return null;
            }

            return state.tokens[account].find((token) => token.symbol === symbol) || null;
        },
    },

    mutations: {
        [TYPES.SET_DATA_FOR](state, { type, account, chain, data }) {
            !state[type] && (state[type] = {});
            !state[type][account] && (state[type][account] = {});
            !state[type][account][chain] && (state[type][account][chain] = {});

            return (state[type][account][chain] = data);
        },

        [TYPES.SET_ASSETS_BALANCE](state, { account, data }) {
            if (!state.assetsBalances[account]) {
                state.assetsBalances[account] = {};
            }

            state.assetsBalances[account] = data;
        },

        [TYPES.SET_TOTAL_BALANCE](state, { account, data }) {
            if (!state.totalBalances[account]) {
                state.totalBalances[account] = {};
            }

            state.totalBalances[account] = data;
        },

        [TYPES.SET_DISABLE_LOADER](state, value) {
            state.disableLoader = value;
        },

        [TYPES.SET_LOADER](state, value) {
            state.loader = value;
        },

        [TYPES.SET_LOADING_BY_CHAIN](state, { account, chain, value }) {
            !state.loadingByChain[account] && (state.loadingByChain[account] = {});
            !state.loadingByChain[account][chain] && (state.loadingByChain[account][chain] = false);
            state.loadingByChain[account][chain] = value || false;
        },

        [TYPES.CALCULATE_BALANCE_BY_TYPE](state, { value, getters }) {
            const { account, type } = value;

            // calculating balances
            if (!state.assetsBalances[account]) {
                state.assetsBalances[account] = 0;
            }
            if (!state.totalBalances[account]) {
                state.totalBalances[account] = 0;
            }

            const allTokens = getters.getAccountBalanceByType(account, 'tokens');
            const allIntegrations = getters.getAccountBalanceByType(account, 'integrations');

            if (BALANCE_ALLOW_TYPES.includes(type)) {
                const assetsBalance = getTotalBalance(allTokens);

                const integrationsBalance = getIntegrationsBalance(allIntegrations);

                const totalBalance = BigNumber(assetsBalance).plus(integrationsBalance).toNumber();

                state.totalBalances[account] = totalBalance;

                type === 'tokens' && (state.assetsBalances[account] = assetsBalance.toNumber() || 0);
            }
        },
        [TYPES.SET_IS_INIT_CALLED](state, { account, time }) {
            if (!state.isInitCalled[account]) {
                state.isInitCalled[account] = null;
            }

            state.isInitCalled[account] = time;
        },
    },

    actions: {
        async loadFromCache({ dispatch }, { account, chain, address, type }) {
            const balances = await balancesDB.getBalancesByType('balances', { account, chain, address, type });

            if (!balances) {
                return;
            }

            dispatch('setDataFor', { type, account, chain, data: balances });
        },
        setDataFor({ commit, getters }, value) {
            commit(TYPES.SET_DATA_FOR, value);

            if (BALANCE_ALLOW_TYPES.includes(value.type)) {
                commit(TYPES.CALCULATE_BALANCE_BY_TYPE, { value, getters });
            }
        },
        setLoader({ commit }, value) {
            commit(TYPES.SET_LOADER, value);
        },
        setDisableLoader({ commit }, value) {
            commit(TYPES.SET_DISABLE_LOADER, value);
        },
        setAssetsBalances({ commit }, value) {
            commit(TYPES.SET_ASSETS_BALANCE, value);
        },
        setLoadingByChain({ commit }, value) {
            commit(TYPES.SET_LOADING_BY_CHAIN, value);
        },
        setNativeTokenByChain({ commit }, value) {
            commit(TYPES.SET_NATIVE_ASSET, value);
        },
        setIsInitCall({ commit }, value) {
            commit(TYPES.SET_IS_INIT_CALLED, value);
        },
    },
};
