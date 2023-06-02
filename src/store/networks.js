import axios from 'axios';
import { getNetworksConfig } from '@/api/networks';

const types = {
    SET_NETWORKS: 'SET_NETWORKS',
    SET_SELECTED_NETWORK: 'SET_SELECTED_NETWORK',
    SET_ZOMET_NETWORKS: 'SET_ZOMET_NETWORKS',
};

export default {
    namespaced: true,
    state: () => ({
        networks: {},
        selectedNetwork: null,
        zometNetworks: [],
    }),

    getters: {
        networks: (state) => state.networks,
        selectedNetwork: (state) => state.selectedNetwork,
        zometNetworks: (state) => state.zometNetworks,
    },

    mutations: {
        [types.SET_NETWORKS](state, value) {
            state.networks = value;
        },
        [types.SET_SELECTED_NETWORK](state, value) {
            state.selectedNetwork = value;
        },
        [types.SET_ZOMET_NETWORKS](state, value) {
            state.zometNetworks = value;
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

        async initZometNets({ commit }) {
            const response = await getNetworksConfig();
            if (response.status === 200) {
                const nets = [];
                for (const network in response.data) {
                    nets.push(response.data[network]);
                }
                commit(types.SET_ZOMET_NETWORKS, nets);
            }
        },
    },
};
