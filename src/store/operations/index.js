import { DIRECTIONS, TOKEN_SELECT_TYPES } from '@/shared/constants/operations';

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

    SET_ALLOWANCE_FOR_ACCOUNT_ADDRESS: 'SET_ALLOWANCE_FOR_ACCOUNT_ADDRESS',
    SET_APPROVE_FOR_ACCOUNT_ADDRESS: 'SET_APPROVE_FOR_ACCOUNT_ADDRESS',

    SET_CLEAR_APPROVE_FOR_TOKEN: 'SET_CLEAR_APPROVE_FOR_TOKEN',
};

const getApproveOrAllowance = (state, target, { account = null, chain = null, tokenAddress = null, service = null }) => {
    if (!account) {
        return null;
    }

    if (!chain) {
        return null;
    }

    if (!tokenAddress) {
        return null;
    }

    if (!service) {
        return null;
    }

    if (!state[target]) {
        return null;
    }

    const targetKey = `${account}:${chain}:${service}:${tokenAddress}`;

    return state[target][targetKey];
};

export default {
    namespaced: true,
    state: () => ({
        direction: DIRECTIONS.SOURCE,
        selectType: TOKEN_SELECT_TYPES.FROM,
        onlyWithBalance: false,

        srcNetwork: null,
        srcToken: null,
        dstNetwork: null,
        dstToken: null,

        srcAmount: null,
        dstAmount: null,

        allowance: {},

        approve: {},

        receiverAddress: null,
    }),

    getters: {
        srcAmount: (state) => state.srcAmount,
        dstAmount: (state) => state.dstAmount,

        direction: (state) => state.direction,
        selectType: (state) => state.selectType,
        onlyWithBalance: (state) => state.onlyWithBalance,

        srcNetwork: (state) => state.srcNetwork,
        srcToken: (state) => state.srcToken,

        dstNetwork: (state) => state.dstNetwork,
        dstToken: (state) => state.dstToken,

        receiverAddress: (state) => state.receiverAddress,

        allowanceForToken: (state) => (account, chain, tokenAddress, service) =>
            getApproveOrAllowance(state, 'allowance', { account, chain, tokenAddress, service }),

        approveForToken: (state) => (account, chain, tokenAddress, service) =>
            getApproveOrAllowance(state, 'approve', { account, chain, tokenAddress, service }),
    },

    mutations: {
        // =========== AMOUNTS ===========
        [TYPES.SET_SRC_AMOUNT](state, value) {
            state.srcAmount = value;
        },
        [TYPES.SET_DST_AMOUNT](state, value) {
            state.dstAmount = value;
        },
        // =========== TOKENS ===========
        [TYPES.SET_SRC_TOKEN](state, value) {
            state.srcToken = value;
        },
        [TYPES.SET_DST_TOKEN](state, value) {
            state.dstToken = value;
        },
        // =========== NETWORKS ===========
        [TYPES.SET_SRC_NETWORK](state, value) {
            state.srcNetwork = value;
        },
        [TYPES.SET_DST_NETWORK](state, value) {
            state.dstNetwork = value;
        },
        // =========== RECEIVER ADDRESS ===========
        [TYPES.SET_RECEIVER_ADDRESS](state, value) {
            state.receiverAddress = value;
        },
        // =========== OTHER ===========
        [TYPES.SET_ONLY_BALANCE](state, value) {
            state.onlyWithBalance = value;
        },
        [TYPES.SET_DIRECTION](state, value) {
            state.direction = value;
        },
        [TYPES.SET_TOKEN_SELECT_TYPE](state, value) {
            state.selectType = value;
        },
        // =========== APPROVE & ALLOWANCE ===========
        [TYPES.SET_ALLOWANCE_FOR_ACCOUNT_ADDRESS](state, { account, chain, tokenAddress, allowance, service }) {
            const targetKey = `${account}:${chain}:${service}:${tokenAddress}`;

            if (!state.allowance[targetKey]) {
                state.allowance[targetKey] = null;
            }

            state.allowance[targetKey] = allowance;
        },
        [TYPES.SET_APPROVE_FOR_ACCOUNT_ADDRESS](state, { account, chain, tokenAddress, approve, service }) {
            const targetKey = `${account}:${chain}:${service}:${tokenAddress}`;

            if (!state.allowance[targetKey]) {
                state.approve[targetKey] = null;
            }

            state.approve[targetKey] = approve;
        },
        [TYPES.SET_CLEAR_APPROVE_FOR_TOKEN](state, targetKey) {
            if (!state.approve[targetKey]) {
                state.approve[targetKey] = null;
            }
        },
    },

    actions: {
        setSrcAmount({ commit }, value) {
            commit(TYPES.SET_SRC_AMOUNT, value);
        },
        setDstAmount({ commit }, value) {
            commit(TYPES.SET_DST_AMOUNT, value);
        },
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
        setAllowance({ commit }, value) {
            commit(TYPES.SET_ALLOWANCE_FOR_ACCOUNT_ADDRESS, value);
        },
        setApprove({ commit }, value) {
            commit(TYPES.SET_APPROVE_FOR_ACCOUNT_ADDRESS, value);
        },
        clearApproveForToken({ commit }, value) {
            commit(TYPES.SET_APPROVE_FOR_ACCOUNT_ADDRESS, value);
        },
    },
};
