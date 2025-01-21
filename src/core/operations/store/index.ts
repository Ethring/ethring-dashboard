import { Commit } from 'vuex';

const TYPES = {
    SET_IS_OPEN: 'SET_IS_OPEN',

    SET_CURRENT_OPERATION: 'SET_CURRENT_OPERATION',

    SET_OPERATION: 'SET_OPERATION',
    REMOVE_OPERATION: 'REMOVE_OPERATION',

    CLEAR_ALL_OPERATIONS: 'CLEAR_ALL_OPERATIONS',
};

interface IState {
    isOpen: boolean;
    operations: Record<string, any>;
    currentOperationId: string;
}

export default {
    namespaced: true,

    state: (): IState => ({
        isOpen: false,
        operations: {},
        currentOperationId: '',
    }),

    getters: {
        isOpen: (state: IState): boolean => state.isOpen,
        getCurrentOperationId: (state: IState): string => state.currentOperationId,
        getOperations:
            (state: IState) =>
            (type: string): any[] => {
                const operations = [];
                for (const key in state.operations) if (key.includes(type)) operations.push(state.operations[key]);
                return operations;
            },
        getOperationById:
            (state: IState) =>
            (id: string): any =>
                state.operations[id],

        isOperationExist:
            (state: IState) =>
            (type: string, id: string): boolean => {
                if (type === 'deposit' && state.operations[`deposit_${id}`]) return true;
                if (type === 'withdraw' && state.operations[`withdraw_${id}`]) return true;
                return false;
            },

        getOperationsCount: (state: IState): number => Object.keys(state.operations).length,
        getDepositOperationsCount: (state: IState): number => Object.keys(state.operations).filter((key) => key.includes('deposit')).length,
        getWithdrawOperationsCount: (state: IState): number =>
            Object.keys(state.operations).filter((key) => key.includes('withdraw')).length,

        isAllowToAddOps: (state: IState): boolean => Object.keys(state.operations).length < 5,
    },

    mutations: {
        [TYPES.SET_IS_OPEN](state: IState, isOpen: boolean): void {
            state.isOpen = isOpen;
        },
        [TYPES.SET_OPERATION](
            state: IState,
            value: {
                type: string;
                operation: any;
            },
        ): void {
            switch (value.type) {
                case 'deposit':
                    state.operations[`deposit_${value.operation.id}`] = value.operation;
                    break;
                case 'withdraw':
                    state.operations[`withdraw_${value.operation.id}`] = value.operation;
                    break;
            }
        },
        [TYPES.REMOVE_OPERATION](state: IState, { type, id }: { type: string; id: string }): void {
            switch (type) {
                case 'deposit':
                    delete state.operations[`deposit_${id}`];
                    break;
                case 'withdraw':
                    delete state.operations[`withdraw_${id}`];
                    break;
            }

            if (state.currentOperationId === `deposit_${id}` || state.currentOperationId === `withdraw_${id}`)
                state.currentOperationId = '';
        },
        [TYPES.SET_CURRENT_OPERATION](state: IState, id: string): void {
            if (state.operations[`deposit_${id}`]) state.currentOperationId = `deposit_${id}`;
            else if (state.operations[`withdraw_${id}`]) state.currentOperationId = `withdraw_${id}`;
        },

        [TYPES.CLEAR_ALL_OPERATIONS](state: IState): void {
            state.operations = {};
            state.currentOperationId = '';
        },
    },

    actions: {
        setIsOpen({ commit }: { commit: Commit }, isOpen: boolean): void {
            commit(TYPES.SET_IS_OPEN, isOpen);
        },
        setDepositOperation({ state, commit }: { state: IState; commit: Commit }, value: any): void {
            commit(TYPES.SET_OPERATION, value);
        },
        setWithdrawOperation({ state, commit }: { state: IState; commit: Commit }, value: any): void {
            commit(TYPES.SET_OPERATION, value);
        },
        removeOperation({ state, commit }: { state: IState; commit: Commit }, value: any): void {
            commit(TYPES.REMOVE_OPERATION, value);
        },
        setCurrentOperation({ commit }: { commit: Commit }, id: string): void {
            commit(TYPES.SET_CURRENT_OPERATION, id);
        },

        clearAllOperations({ state, commit }: { state: IState; commit: Commit }): void {
            commit(TYPES.CLEAR_ALL_OPERATIONS);
        },
    },
};
