const types = {
  SET_TOKENS: "SET_TOKENS",
  SET_MARKETCAP: "SET_MARKETCAP",
};

export default {
  namespaced: true,
  state: () => ({
    tokens: {},
    marketCap: {},
  }),

  getters: {
    tokens: (state) => state.tokens,
    marketCap: (state) => state.marketCap,
  },

  mutations: {
    [types.SET_TOKENS](state, value) {
      state.tokens = value;
    },
    [types.SET_MARKETCAP](state, value) {
      state.marketCap = value;
    },
  },

  actions: {
    setTokens({ commit }, value) {
      commit(types.SET_TOKENS, value);
    },
    setMarketCap({ commit }, value) {
      commit(types.SET_MARKETCAP, value);
    },
  },
};
