const TYPES = {
    SET_TRANSACTIONS_BY_MODULE: 'SET_TRANSACTIONS_BY_MODULE',
    SET_TRANSACTIONS_BY_REQUEST_ID: 'SET_TRANSACTIONS_BY_REQUEST_ID',
    SET_TRANSACTION_FOR_SIGN: 'SET_TRANSACTION_FOR_SIGN',
    SET_CURRENT_REQUEST_ID: 'SET_CURRENT_REQUEST_ID',
    SET_IS_WAITING_TX_STATUS_FOR_MODULE: 'SET_IS_WAITING_TX_STATUS_FOR_MODULE',
    SET_TRANSACTION_SIGNING_STATUS: 'SET_TRANSACTION_SIGNING_STATUS',
};

export default {
    namespaced: true,

    state: () => ({
        transactionsByModule: {},
        transactionsByRequestID: {},
        transactionForSign: null,

        isWaitingTxStatus: {},

        isTransactionSigning: false,

        currentRequestID: null,
    }),

    getters: {
        isTransactionSigning: (state) => state.isTransactionSigning || false,
        transactionForSign: (state) => state.transactionForSign,
        currentRequestID: (state) => state.currentRequestID,

        isWaitingTxStatusForModule: (state) => (module) => state.isWaitingTxStatus[module] || false,
    },

    mutations: {
        [TYPES.SET_TRANSACTIONS_BY_MODULE](state, { module, account, transactions }) {
            if (!state.transactionsByModule[module]) {
                state.transactionsByModule[module] = {};
            }

            if (!state.transactionsByModule[module][account]) {
                state.transactionsByModule[module][account] = [];
            }

            state.transactionsByModule[module][account] = transactions;
        },
        [TYPES.SET_TRANSACTIONS_BY_REQUEST_ID](state, { requestID, transactions }) {
            if (!state.transactionsByRequestID[requestID]) {
                state.transactionsByRequestID[requestID] = [];
            }

            state.transactionsByRequestID[requestID] = transactions;
        },
        [TYPES.SET_TRANSACTION_FOR_SIGN](state, transaction) {
            state.transactionForSign = transaction;
        },

        [TYPES.SET_CURRENT_REQUEST_ID](state, requestID) {
            state.currentRequestID = requestID;
        },

        [TYPES.SET_IS_WAITING_TX_STATUS_FOR_MODULE](state, { module, isWaiting }) {
            if (module === 'all') {
                for (const key in state.isWaitingTxStatus) {
                    state.isWaitingTxStatus[key] = isWaiting;
                }
            }

            state.isWaitingTxStatus[module] = isWaiting;
        },
        [TYPES.SET_TRANSACTION_SIGNING_STATUS](state, value) {
            state.isTransactionSigning = value;
        },
    },

    actions: {
        setTransactionsForModule({ commit }, { module, account, transactions }) {
            commit(TYPES.SET_TRANSACTIONS_BY_MODULE, { module, account, transactions });
        },
        setTransactionsForRequestID({ commit }, { requestID, transactions }) {
            commit(TYPES.SET_TRANSACTIONS_BY_REQUEST_ID, { requestID, transactions });
        },
        setTransactionForSign({ commit }, transaction) {
            commit(TYPES.SET_TRANSACTION_FOR_SIGN, transaction);
        },
        setCurrentRequestID({ commit }, requestID) {
            commit(TYPES.SET_CURRENT_REQUEST_ID, requestID);
        },
        setIsWaitingTxStatusForModule({ commit }, value) {
            commit(TYPES.SET_IS_WAITING_TX_STATUS_FOR_MODULE, value);
        },
        setTransactionSigning({ commit }, value) {
            commit(TYPES.SET_TRANSACTION_SIGNING_STATUS, value);
        },
    },
};
