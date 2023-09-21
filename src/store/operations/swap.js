const TYPES = {
    SET_SELECTED_NETWORK: 'SET_SELECTED_NETWORK',

    SET_FROM_TOKEN: 'SET_FROM_TOKEN',
    SET_TO_TOKEN: 'SET_TO_TOKEN',

    SET_SELECT_TYPE: 'SET_SELECT_TYPE',
};

export default {
    namespaced: true,
    state: () => ({
        selectedNetwork: null,

        selectType: 'from',

        fromToken: null,
        toToken: null,
    }),

    getters: {
        selectType: (state) => state.selectType,

        selectedNetwork: (state) => state.selectedNetwork,

        fromToken: (state) => state.fromToken,
        toToken: (state) => state.toToken,

        address: (state) => state.address,
    },

    mutations: {
        [TYPES.SET_SELECT_TYPE](state, value) {
            state.selectType = value;
        },
        [TYPES.SET_FROM_TOKEN](state, value) {
            state.fromToken = value;
        },
        [TYPES.SET_TO_TOKEN](state, value) {
            state.toToken = value;
        },
        [TYPES.SET_SELECTED_NETWORK](state, value) {
            state.selectedNetwork = value;
        },
    },

    actions: {
        setSelectedNetwork({ commit }, value) {
            commit(TYPES.SET_SELECTED_NETWORK, value);
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
    },
};
