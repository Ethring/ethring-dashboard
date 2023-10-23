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

    SET_ASSETS_BALANCE: 'SET_ASSETS_BALANCE',

    SET_LOADING_BY_CHAIN: 'SET_LOADING_BY_CHAIN',

    SET_TOTAL_BALANCE: 'SET_TOTAL_BALANCE',
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
        assetsBalances: {},
        totalBalances: {},
    }),

    getters: {
        loader: (state) => state.loader,

        tokens: (state) => state.tokens,
        integrations: (state) => state.integrations,

        groupTokens: (state) => state.groupTokens,

        getTokensListForChain:
            (state) =>
            (chain, { account = null } = {}) => {
                if (!state.groupTokens[account] || !state.groupTokens[account][chain]) {
                    return [];
                }

                return state.groupTokens[account][chain]?.list || [];
            },

        marketCap: (state) => state.marketCap,
        selectType: (state) => state.selectType,
        fromToken: (state) => state.fromToken,
        toToken: (state) => state.toToken,
        address: (state) => state.address,
        disableLoader: (state) => state.disableLoader,
        assetsBalances: (state) => state.assetsBalances,
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

        [TYPES.SET_ADDRESS](state, value) {
            state.address = value;
        },

        [TYPES.SET_GROUP_TOKENS](state, { chain, account, data }) {
            if (!state.groupTokens[account]) {
                state.groupTokens[account] = {};
            }

            if (!state.groupTokens[account][chain]) {
                state.groupTokens[account][chain] = {};
            }

            state.groupTokens[account][chain] = data;
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
        setAssetsBalances({ commit }, value) {
            commit(TYPES.SET_ASSETS_BALANCE, value);
        },
        setTotalBalances({ commit }, value) {
            commit(TYPES.SET_TOTAL_BALANCE, value);
        },
        setLoadingByChain({ commit }, value) {
            commit(TYPES.SET_LOADING_BY_CHAIN, value);
        },
    },
};
