import { getBalancesByAddress } from '@/api/data-provider';

import store from './index';

import { sortByKey } from '@/helpers/utils';

const TYPES = {
    SET_DATA_FOR: 'SET_DATA_FOR',

    SET_TOKENS: 'SET_TOKENS',

    SET_GROUP_TOKENS: 'SET_GROUP_TOKENS',

    SET_MARKETCAP: 'SET_MARKETCAP',

    SET_LOADER: 'SET_LOADER',

    SET_SELECT_TYPE: 'SET_SELECT_TYPE',

    SET_FROM_TOKEN: 'SET_FROM_TOKEN',
    SET_TO_TOKEN: 'SET_TO_TOKEN',
    SET_ADDRESS: 'SET_ADDRESS',

    SET_DISABLE_LOADER: 'SET_DISABLE_LOADER',

    SET_TOTAL_BALANCE: 'SET_TOTAL_BALANCE',

    SET_LOADING_BY_CHAIN: 'SET_LOADING_BY_CHAIN',
};

export default {
    namespaced: true,

    state: () => ({
        loadingByChain: {},
        fetchingBalances: false,
        loader: false,
        tokens: {},
        groupTokens: {},
        marketCap: {},
        selectType: 'from',
        fromToken: null,
        toToken: null,
        address: '',
        disableLoader: false,
        integrations: {},
        totalBalances: {},
    }),

    getters: {
        loader: (state) => state.loader,

        tokens: (state) => state.tokens,
        integrations: (state) => state.integrations,

        groupTokens: (state) => state.groupTokens,

        getTokensListForChain: (state) => (chain) => {
            return state.groupTokens[chain]?.list || [];
        },

        marketCap: (state) => state.marketCap,
        selectType: (state) => state.selectType,
        fromToken: (state) => state.fromToken,
        toToken: (state) => state.toToken,
        address: (state) => state.address,
        disableLoader: (state) => state.disableLoader,
        totalBalances: (state) => state.totalBalances,

        loadingByChain: (state) => (chain) => state.loadingByChain[chain] || false,
    },

    mutations: {
        [TYPES.SET_DATA_FOR](state, { type, account, data }) {
            if (!state[type][account]) {
                state[type][account] = {};
            }

            state[type][account] = data;
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

        [TYPES.SET_ADDRESS](state, value) {
            state.address = value;
        },

        [TYPES.SET_GROUP_TOKENS](state, { chain, data }) {
            if (!state.groupTokens[chain]) {
                state.groupTokens[chain] = {};
            }

            state.groupTokens[chain] = data;
        },

        [TYPES.SET_MARKETCAP](state, value) {
            state.marketCap = value;
        },

        [TYPES.SET_LOADER](state, value) {
            state.loader = value;
        },

        [TYPES.SET_SELECT_TYPE](state, value) {
            state.selectType = value;
        },

        [TYPES.SET_FROM_TOKEN](state, value) {
            state.fromToken = value;
        },

        [TYPES.SET_TO_TOKEN](state, value) {
            state.toToken = value;
        },

        [TYPES.SET_LOADING_BY_CHAIN](state, { chain, value }) {
            state.loadingByChain[chain] = value || false;
        },
    },

    actions: {
        setDataFor({ commit }, value) {
            commit(TYPES.SET_DATA_FOR, value);
        },
        setTokens({ commit }, value) {
            commit(TYPES.SET_TOKENS, value);
        },
        setAddress({ commit }, value) {
            commit(TYPES.SET_ADDRESS, value);
        },
        setGroupTokens({ commit }, value) {
            commit(TYPES.SET_GROUP_TOKENS, value);
        },
        setMarketCap({ commit }, value) {
            commit(TYPES.SET_MARKETCAP, value);
        },
        setLoader({ commit }, value) {
            commit(TYPES.SET_LOADER, value);
        },
        setDisableLoader({ commit }, value) {
            commit(TYPES.SET_DISABLE_LOADER, value);
        },
        setSelectType({ commit }, value) {
            commit(TYPES.SET_SELECT_TYPE, value);
        },
        setFromToken({ commit }, value) {
            commit(TYPES.SET_FROM_TOKEN, value);
        },
        setToToken({ commit }, value) {
            commit(TYPES.SET_TO_TOKEN, value);
        },

        setTotalBalances({ commit }, value) {
            commit(TYPES.SET_TOTAL_BALANCE, value);
        },

        setLoadingByChain({ commit }, value) {
            commit(TYPES.SET_LOADING_BY_CHAIN, value);
        },

        async updateTokenBalances(_, selectedNet) {
            const tokens = _.getters['groupTokens'];
            const tokensByAddress = _.getters['tokens'];

            const result = await getBalancesByAddress(selectedNet.net, selectedNet.address, {
                fetchTokens: true,
                fetchIntegrations: false,
            });

            if (result.tokens && result.tokens.length) {
                const nativeToken = result.tokens.find((elem) => elem.symbol === selectedNet.info.symbol);
                tokens[selectedNet.net].balance = nativeToken?.balance;
                tokens[selectedNet.net].balanceUsd = nativeToken?.balanceUsd;
                tokens[selectedNet.net].list = result.tokens;
                for (const item of result.tokens) {
                    const index = tokensByAddress[selectedNet.address].findIndex(
                        (elem) =>
                            (elem.symbol === item.symbol && elem.address === item.address) || (!item.address && elem.symbol === item.symbol)
                    );
                    if (index !== -1) {
                        item.chainLogo = selectedNet.info?.logo;
                        tokensByAddress[selectedNet.address][index] = item;
                    } else {
                        tokensByAddress[selectedNet.address].push(item);
                    }
                }
            }

            store.dispatch('tokens/setDataFor', {
                type: 'tokens',
                account: selectedNet.address,
                data: tokensByAddress[selectedNet.address],
            });
            store.dispatch('tokens/setGroupTokens', tokens);

            const wallet = {
                ...selectedNet.info,
                balance: tokens[selectedNet.net]?.balance,
                balanceUsd: tokens[selectedNet.net].balanceUsd,
                list: sortByKey(tokens[selectedNet.net].list, 'balanceUsd'),
            };

            selectedNet.update(wallet);
        },
        async getListNonZeroTokens() {},
    },
};
