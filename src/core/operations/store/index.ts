import { Commit } from 'vuex';

const TYPES = {
    SET_IS_OPEN: 'SET_IS_OPEN',
    SET_OPERATION: 'SET_DEPOSIT_OPERATION',
    REMOVE_OPERATION: 'REMOVE_OPERATION',
};

interface IState {
    isOpen: boolean;
    operations: Record<string, any>;
}

export default {
    namespaced: true,

    state: (): IState => ({
        isOpen: false,
        operations: {},
    }),

    getters: {
        isOpen: (state: IState): boolean => state.isOpen,
        getOperations:
            (state: IState) =>
            (type: string): any[] => {
                const operations = [];
                for (const key in state.operations) if (key.includes(type)) operations.push(state.operations[key]);
                return operations;
            },
        getOperationById:
            (state: IState) =>
            (type: string, id: string): any => {
                if (type === 'deposit') return state.operations[`deposit_${id}`];
                return state.operations[`withdraw_${id}`];
            },

        isOperationExist:
            (state: IState) =>
            (type: string, id: string): boolean => {
                if (type === 'deposit' && state.operations[`deposit_${id}`]) return true;
                if (type === 'withdraw' && state.operations[`withdraw_${id}`]) return true;
                return false;
            },

        getOperationsCount: (state: IState): number => Object.keys(state.operations).length,
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
    },
};
