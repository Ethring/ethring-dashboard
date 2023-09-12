import { fetchData } from '@/api/fetchData';
import axios from 'axios';

const DEFAULT_URL = process.env.VUE_APP_DEBRIDGE_API;

const types = {
    SET_SRC_NETWORKS: 'SET_SRC_NETWORKS',
    SET_DST_NETWORKS: 'SET_DST_NETWORKS',
};

export default {
    namespaced: true,
    state: () => ({
        selectedSrcNetwork: null,
        selectedDstNetwork: null,
    }),

    getters: {
        selectedSrcNetwork: (state) => state.selectedSrcNetwork,
        selectedDstNetwork: (state) => state.selectedDstNetwork,
    },

    mutations: {
        [types.SET_SRC_NETWORKS](state, value) {
            state.selectedSrcNetwork = value;
        },
        [types.SET_DST_NETWORKS](state, value) {
            state.selectedDstNetwork = value;
        },
    },

    actions: {
        setSelectedSrcNetwork({ commit }, value) {
            commit(types.SET_SRC_NETWORKS, value);
        },
        setSelectedDstNetwork({ commit }, value) {
            commit(types.SET_DST_NETWORKS, value);
        },

        /* ALLOWANCE */
        async getAllowance(_, { net, tokenAddress, ownerAddress, url }) {
            let response;
            try {
                response = await axios.get(`${url || DEFAULT_URL}getAllowance`, {
                    params: {
                        net,
                        tokenAddress,
                        ownerAddress,
                    },
                });
                return response.data.data;
            } catch (err) {
                return { error: err.response?.data?.error || err?.message };
            }
        },

        /* APPROVE TX */
        async getApproveTx(_, { net, tokenAddress, ownerAddress, url }) {
            return await fetchData({
                url: url || DEFAULT_URL,
                route: 'getApproveTx',
                params: {
                    net,
                    tokenAddress,
                    ownerAddress,
                },
            });
        },

        /* ESTIMATE BRIDGE */
        async estimateBridge(_, { fromNet, fromTokenAddress, amount, toNet, toTokenAddress, url, ownerAddress }) {
            let response;
            try {
                response = await axios.get(`${url || DEFAULT_URL}estimateBridge`, {
                    params: {
                        fromNet,
                        fromTokenAddress,
                        amount,
                        toNet,
                        toTokenAddress,
                        ownerAddress,
                    },
                });
                return response.data?.data;
            } catch (err) {
                return { error: err.response?.data?.error || err?.message };
            }
        },

        /* GET BRIDGE TX */
        async getBridgeTx(
            _,
            { fromNet, fromTokenAddress, amount, toNet, toTokenAddress, recipientAddress, fallbackAddress, ownerAddress, url }
        ) {
            return await fetchData({
                url: url || DEFAULT_URL,
                route: 'getBridgeTx',
                params: {
                    fromNet,
                    fromTokenAddress,
                    amount,
                    toNet,
                    toTokenAddress,
                    recipientAddress,
                    fallbackAddress,
                    ownerAddress,
                },
            });
        },
    },
};
