import axios from 'axios';

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
    SET_INTEGRATIONS: 'SET_INTEGRATIONS',
    SET_TOTAL_BALANCE: 'SET_TOTAL_BALANCE',
};

export default {
    namespaced: true,
    state: () => ({
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
        groupTokens: (state) => state.groupTokens,
        marketCap: (state) => state.marketCap,
        selectType: (state) => state.selectType,
        fromToken: (state) => state.fromToken,
        toToken: (state) => state.toToken,
        address: (state) => state.address,
        disableLoader: (state) => state.disableLoader,
        integrations: (state) => state.integrations,
        totalBalances: (state) => state.totalBalances,
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

        async updateTokenBalances(_, selectedNet) {
            const assetsInfo = async () => {
                try {
                    const response = await axios.get(
                        `${process.env.VUE_APP_DATA_PROVIDER_URL}/balances?net=${selectedNet.net}&address=${selectedNet.address}&tokens=true`
                    );

                    if (response.status === 200) {
                        return response.data.data;
                    }

                    return null;
                } catch {
                    return null;
                }
            };

            const tokens = _.getters['groupTokens'];
            const result = await assetsInfo();

            if (result.tokens && result.tokens.length) {
                const nativeToken = result.tokens.find((elem) => elem.code === selectedNet.info.code);
                tokens[selectedNet.net].balance = nativeToken?.balance;
                tokens[selectedNet.net].balanceUsd = nativeToken?.balanceUsd;
                tokens[selectedNet.net].list = result.tokens;
            }

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
