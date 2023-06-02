import axios from 'axios';

const types = {
    SET_TOKENS: 'SET_TOKENS',
    SET_GROUP_TOKENS: 'SET_GROUP_TOKENS',
    SET_MARKETCAP: 'SET_MARKETCAP',
    SET_LOADER: 'SET_LOADER',
    SET_FAVOURITES: 'SET_FAVOURITES',
    REMOVE_FAVOURITE: 'REMOVE_FAVOURITE',
    SET_SELECT_TYPE: 'SET_SELECT_TYPE',
    SET_FROM_TOKEN: 'SET_FROM_TOKEN',
    SET_TO_TOKEN: 'SET_TO_TOKEN',
};

export default {
    namespaced: true,
    state: () => ({
        favourites: {},
        loader: false,
        tokens: {},
        groupTokens: {},
        marketCap: {},
        selectType: 'from',
        fromToken: null,
        toToken: null,
    }),

    getters: {
        favourites: (state) => state.favourites,
        loader: (state) => state.loader,
        tokens: (state) => state.tokens,
        groupTokens: (state) => state.groupTokens,
        marketCap: (state) => state.marketCap,
        selectType: (state) => state.selectType,
        fromToken: (state) => state.fromToken,
        toToken: (state) => state.toToken,
    },

    mutations: {
        [types.SET_TOKENS](state, value) {
            state.tokens = value;
        },
        [types.SET_GROUP_TOKENS](state, value) {
            state.groupTokens = value;
        },
        [types.SET_MARKETCAP](state, value) {
            state.marketCap = value;
        },
        [types.SET_LOADER](state, value) {
            state.loader = value;
        },
        [types.SET_SELECT_TYPE](state, value) {
            state.selectType = value;
        },
        [types.SET_FROM_TOKEN](state, value) {
            state.fromToken = value;
        },
        [types.SET_TO_TOKEN](state, value) {
            state.toToken = value;
        },
        [types.REMOVE_FAVOURITE](state, { net, address }) {
            state.favourites[net] = state.favourites[net].filter((favAddr) => favAddr !== address);
        },
        [types.SET_FAVOURITES](state, { net, address }) {
            if (!state.favourites[net]) {
                state.favourites[net] = [];
            }

            if (!state.favourites[net].includes(address)) {
                state.favourites[net].push(address);
            }
        },
    },

    actions: {
        setTokens({ commit }, value) {
            commit(types.SET_TOKENS, value);
        },
        setGroupTokens({ commit }, value) {
            commit(types.SET_GROUP_TOKENS, value);
        },
        setMarketCap({ commit }, value) {
            commit(types.SET_MARKETCAP, value);
        },
        setLoader({ commit }, value) {
            commit(types.SET_LOADER, value);
        },
        setFavourites({ commit }, { net, address }) {
            commit(types.SET_FAVOURITES, { net, address });
        },
        removeFavourite({ commit }, { net, address }) {
            commit(types.REMOVE_FAVOURITE, { net, address });
        },
        setSelectType({ commit }, value) {
            commit(types.SET_SELECT_TYPE, value);
        },
        setFromToken({ commit }, value) {
            commit(types.SET_FROM_TOKEN, value);
        },
        setToToken({ commit }, value) {
            commit(types.SET_TO_TOKEN, value);
        },
        async prepareTransfer(_, { net, from, amount, toAddress }) {
            let response;

            try {
                response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/blockchain/${net}/${from}/builder/transfer?version=1.1.0`, {
                    params: {
                        amount,
                        toAddress,
                    },
                });

                return {
                    transaction: response.data.data.transaction,
                };
            } catch (err) {
                return {
                    error: err.response.data.error,
                };
            }
        },
    },
};
