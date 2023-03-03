import axios from "axios";

const types = {
  SET_NETWORKS: "SET_NETWORKS",
};

export default {
  namespaced: true,
  state: () => ({
    networks: {},
  }),

  getters: {
    networks: (state) => state.networks,
  },

  mutations: {
    [types.SET_NETWORKS](state, value) {
      state.networks = value;
    },
  },

  actions: {
    async init({ commit }) {
      const response = await axios.get(
        "https://work.3ahtim54r.ru/api/networks.json?version=1.1.0"
      );
      if (response.status === 200) {
        commit(types.SET_NETWORKS, response.data);
      }
    },
  },
};
