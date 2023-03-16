const types = {
  SET_TOKENS: "SET_TOKENS",
  SET_GROUP_TOKENS: "SET_GROUP_TOKENS",
  SET_MARKETCAP: "SET_MARKETCAP",
  SET_LOADER: "SET_LOADER",
};

export default {
  namespaced: true,
  state: () => ({
    loader: false,
    tokens: {},
    groupTokens: {},
    marketCap: {},
  }),

  getters: {
    loader: (state) => state.loader,
    tokens: (state) => state.tokens,
    groupTokens: (state) => state.groupTokens,
    marketCap: (state) => state.marketCap,
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
  },
};
