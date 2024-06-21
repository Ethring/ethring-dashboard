import { ModuleTypes } from '@/shared/models/enums/modules.enum';
import { ITransactionResponse } from '@/core/transaction-manager/types/Transaction';

import TimerWorker from '@/timer-worker.js?worker';

const worker = new TimerWorker();
const statusWorker = new TimerWorker();

const TYPES = {
    SET_TRANSACTION_FOR_SIGN: 'SET_TRANSACTION_FOR_SIGN',
    SET_TRANSACTIONS_BY_MODULE: 'SET_TRANSACTIONS_BY_MODULE',

    SET_CURRENT_REQUEST_ID: 'SET_CURRENT_REQUEST_ID',
    SET_TRANSACTIONS_BY_REQUEST_ID: 'SET_TRANSACTIONS_BY_REQUEST_ID',

    SET_TRANSACTION_SIGNING_STATUS: 'SET_TRANSACTION_SIGNING_STATUS',
    SET_IS_WAITING_TX_STATUS_FOR_MODULE: 'SET_IS_WAITING_TX_STATUS_FOR_MODULE',

    SET_TX_TIMER_ID: 'SET_TX_TIMER_ID',
    SET_TX_STATUS_TIMER_ID: 'SET_TX_STATUS_TIMER_ID',
};

interface IState {
    transactionsByModule: {
        [key: string]: any;
    };

    transactionsByRequestID: {
        [key: string]: any[];
    };

    transactionForSign: any | null;

    isWaitingTxStatus: {
        [key in ModuleTypes]?: boolean;
    };

    isTransactionSigning: boolean;

    currentRequestID: string | null;

    txTimerID: number | null;

    txTimerWorker: TimerWorker | null;

    txStatusTimerID: number | null;

    txStatusTimerWorker: TimerWorker | null;
}

export default {
    namespaced: true,

    state: (): IState => ({
        transactionsByModule: {},
        transactionsByRequestID: {},
        transactionForSign: null,

        isWaitingTxStatus: {},

        isTransactionSigning: false,

        currentRequestID: null,

        txTimerID: null,
        txTimerWorker: worker,

        txStatusTimerID: null,
        txStatusTimerWorker: statusWorker,
    }),

    getters: {
        isTransactionSigning: (state: IState) => state.isTransactionSigning,
        transactionForSign: (state: IState) => state.transactionForSign,
        currentRequestID: (state: IState) => state.currentRequestID,

        isWaitingTxStatusForModule: (state: IState) => (module: ModuleTypes) => state.isWaitingTxStatus[module] || false,

        txTimerID: (state: IState) => state.txTimerID,
        txTimerWorker: (state: IState) => state.txTimerWorker,

        txStatusTimerID: (state: IState) => state.txStatusTimerID,
        txStatusTimerWorker: (state: IState) => state.txStatusTimerWorker,
    },

    mutations: {
        [TYPES.SET_TRANSACTIONS_BY_MODULE](
            state: IState,
            { module, account, transactions }: { module: ModuleTypes; account: string; transactions: ITransactionResponse[] },
        ) {
            if (!state.transactionsByModule[module]) state.transactionsByModule[module] = {};

            if (!state.transactionsByModule[module][account]) state.transactionsByModule[module][account] = [];

            state.transactionsByModule[module][account] = transactions;
        },
        [TYPES.SET_TRANSACTIONS_BY_REQUEST_ID](
            state: IState,
            { requestID, transactions }: { requestID: string; transactions: ITransactionResponse[] },
        ) {
            if (!state.transactionsByRequestID[requestID]) state.transactionsByRequestID[requestID] = [];

            state.transactionsByRequestID[requestID] = transactions;
        },
        [TYPES.SET_TRANSACTION_FOR_SIGN](state: IState, transaction: ITransactionResponse) {
            state.transactionForSign = transaction;
        },

        [TYPES.SET_CURRENT_REQUEST_ID](state: IState, requestID: string) {
            state.currentRequestID = requestID;
        },

        [TYPES.SET_IS_WAITING_TX_STATUS_FOR_MODULE](
            state: IState,
            { module, isWaiting }: { module: ModuleTypes | 'all'; isWaiting: boolean },
        ) {
            if (module === 'all') for (const key in state.isWaitingTxStatus) state.isWaitingTxStatus[key as ModuleTypes] = isWaiting;

            state.isWaitingTxStatus[module as ModuleTypes] = isWaiting;
        },
        [TYPES.SET_TRANSACTION_SIGNING_STATUS](state: IState, value: boolean) {
            if (state.isTransactionSigning === value) return;
            state.isTransactionSigning = value;
        },

        [TYPES.SET_TX_TIMER_ID](state: IState, timerID: number | null) {
            state.txTimerID = timerID;
        },

        [TYPES.SET_TX_STATUS_TIMER_ID](state: IState, timerID: number | null) {
            state.txStatusTimerID = timerID;
        },
    },

    actions: {
        setTransactionsForModule(
            { commit }: { commit: any },
            { module, account, transactions }: { module: ModuleTypes; account: string; transactions: ITransactionResponse[] },
        ) {
            commit(TYPES.SET_TRANSACTIONS_BY_MODULE, { module, account, transactions });
        },
        setTransactionsForRequestID(
            { commit }: { commit: any },
            { requestID, transactions }: { requestID: string; transactions: ITransactionResponse[] },
        ) {
            commit(TYPES.SET_TRANSACTIONS_BY_REQUEST_ID, { requestID, transactions });
        },
        setTransactionForSign({ commit }: { commit: any }, transaction: ITransactionResponse) {
            commit(TYPES.SET_TRANSACTION_FOR_SIGN, transaction);
        },
        setCurrentRequestID({ commit }: { commit: any }, requestID: string) {
            commit(TYPES.SET_CURRENT_REQUEST_ID, requestID);
        },
        setIsWaitingTxStatusForModule({ commit }: { commit: any }, value: { module: ModuleTypes; isWaiting: boolean }) {
            commit(TYPES.SET_IS_WAITING_TX_STATUS_FOR_MODULE, value);
        },
        setTransactionSigning({ commit }: { commit: any }, value: boolean) {
            commit(TYPES.SET_TRANSACTION_SIGNING_STATUS, value);
        },
        setTxTimerID({ state, commit }: any, value: number) {
            if (!value && state.txTimerID) state.txTimerWorker.postMessage({ clearTimer: true, timerID: state.txTimerID });
            commit(TYPES.SET_TX_TIMER_ID, value);
        },
        setTxStatusTimerID({ state, commit }: any, value: number) {
            if (!value && state.txStatusTimerID)
                state.txStatusTimerWorker.postMessage({ clearTimer: true, timerID: state.txStatusTimerID });
            commit(TYPES.SET_TX_STATUS_TIMER_ID, value);
        },
    },
};
