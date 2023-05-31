import axios from 'axios';

const types = {
    SET_NETWORKS: 'SET_NETWORKS',
    SET_SELECTED_NETWORK: 'SET_SELECTED_NETWORK',
};

export default {
    namespaced: true,
    state: () => ({
        networks: {},
        selectedNetwork: null,
    }),

    getters: {
        networks: (state) => state.networks,
        selectedNetwork: (state) => state.selectedNetwork,
    },

    mutations: {
        [types.SET_NETWORKS](state, value) {
            state.networks = value;
        },
        [types.SET_SELECTED_NETWORK](state, value) {
            state.selectedNetwork = value;
        },
    },

    actions: {
        setSelectedNetwork({ commit }, value) {
            commit(types.SET_SELECTED_NETWORK, value);
        },
        async init({ commit }) {
            const response = await axios.get('https://work.3ahtim54r.ru/api/networks.json?version=1.1.0');
            if (response.status === 200) {
                commit(types.SET_NETWORKS, response.data);
            }
        },
    },
};
