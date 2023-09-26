import { DIRECTIONS, TOKEN_SELECT_TYPES } from '../../shared/constants/operations';

const TYPES = {
    SET_SRC_NETWORK: 'SET_FROM_NETWORK',
    SET_DST_NETWORK: 'SET_DST_NETWORK',

    SET_SRC_TOKEN: 'SET_FROM_TOKEN',
    SET_DST_TOKEN: 'SET_DST_TOKEN',

    SET_SRC_AMOUNT: 'SET_SRC_AMOUNT',

    SET_DST_AMOUNT: 'SET_DST_AMOUNT',

    SET_SLIPPAGE: 'SET_SLIPPAGE',

    SET_RECEIVER_ADDRESS: 'SET_RECEIVER_ADDRESS',

    SET_ONLY_BALANCE: 'SET_ONLY_BALANCE',

    SET_DIRECTION: 'SET_DIRECTION',

    SET_TOKEN_SELECT_TYPE: 'SET_TOKEN_SELECT_TYPE',
};

export default {
    namespaced: true,
    state: () => ({
        direction: DIRECTIONS.SOURCE,
        selectType: TOKEN_SELECT_TYPES.FROM,
        srcNetwork: null,
        srcToken: null,
        dstNetwork: null,
        dstToken: null,
        receiverAddress: null,
        onlyWithBalance: false,
    }),

    getters: {
        selectType: (state) => state.selectType,
        srcNetwork: (state) => state.srcNetwork,
        srcToken: (state) => state.srcToken,
        dstNetwork: (state) => state.dstNetwork,
        dstToken: (state) => state.dstToken,
        receiverAddress: (state) => state.receiverAddress,
        onlyWithBalance: (state) => state.onlyWithBalance,
        direction: (state) => state.direction,
    },

    mutations: {
        [TYPES.SET_SRC_TOKEN](state, value) {
            state.srcToken = value;
        },
        [TYPES.SET_DST_TOKEN](state, value) {
            state.dstToken = value;
        },
        [TYPES.SET_SRC_NETWORK](state, value) {
            state.srcNetwork = value;
        },
        [TYPES.SET_DST_NETWORK](state, value) {
            state.dstNetwork = value;
        },
        [TYPES.SET_RECEIVER_ADDRESS](state, value) {
            state.receiverAddress = value;
        },
        [TYPES.SET_ONLY_BALANCE](state, value) {
            state.onlyWithBalance = value;
        },
        [TYPES.SET_DIRECTION](state, value) {
            state.direction = value;
        },
        [TYPES.SET_TOKEN_SELECT_TYPE](state, value) {
            state.selectType = value;
        },
    },

    actions: {
        setSrcToken({ commit }, value) {
            commit(TYPES.SET_SRC_TOKEN, value);
        },
        setDstToken({ commit }, value) {
            commit(TYPES.SET_DST_TOKEN, value);
        },
        setSrcNetwork({ commit }, value) {
            commit(TYPES.SET_SRC_NETWORK, value);
        },
        setDstNetwork({ commit }, value) {
            commit(TYPES.SET_DST_NETWORK, value);
        },
        setReceiverAddress({ commit }, value) {
            commit(TYPES.SET_RECEIVER_ADDRESS, value);
        },
        setOnlyWithBalance({ commit }, value) {
            commit(TYPES.SET_ONLY_BALANCE, value);
        },
        setDirection({ commit }, value) {
            commit(TYPES.SET_DIRECTION, value);
        },
        setSelectType({ commit }, value) {
            commit(TYPES.SET_TOKEN_SELECT_TYPE, value);
        },
    },
};
