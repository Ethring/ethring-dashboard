import axios from 'axios';

import { fetchData } from '@/api/fetchData';
import { getServices, SERVICE_TYPE } from '@/config/services';

const DEFAULT_URL = process.env.VUE_APP_DEBRIDGE_API;
const DEFAULT_SERVICE_ID = 'bridge-debridge';

const TYPES = {
    SET_SERVICE: 'SET_SERVICE',

    SET_SRC_NETWORKS: 'SET_SRC_NETWORKS',
    SET_DST_NETWORKS: 'SET_DST_NETWORKS',
};

export default {
    namespaced: true,
    state: () => ({
        service: getServices(SERVICE_TYPE.BRIDGE).find((service) => service.id === DEFAULT_SERVICE_ID),
        services: getServices(SERVICE_TYPE.BRIDGE),
        selectedSrcNetwork: null,
        selectedDstNetwork: null,
    }),

    getters: {
        service: (state) => state.service,

        selectedSrcNetwork: (state) => state.selectedSrcNetwork,
        selectedDstNetwork: (state) => state.selectedDstNetwork,
    },

    mutations: {
        [TYPES.SET_SRC_NETWORKS](state, value) {
            state.selectedSrcNetwork = value;
        },
        [TYPES.SET_DST_NETWORKS](state, value) {
            state.selectedDstNetwork = value;
        },
        [TYPES.SET_SERVICE](state, value) {
            state.service = value;
        },
    },

    actions: {
        setService({ commit }, value) {
            commit(TYPES.SET_SERVICE, value);
        },

        setSelectedSrcNetwork({ commit }, value) {
            commit(TYPES.SET_SRC_NETWORKS, value);
        },

        setSelectedDstNetwork({ commit }, value) {
            commit(TYPES.SET_DST_NETWORKS, value);
        },

        // TODO: move to api
        // TODO: remove from store
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
