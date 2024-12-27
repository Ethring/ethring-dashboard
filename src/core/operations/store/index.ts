import { Commit } from 'vuex';

const TYPES = {
    SET_IS_OPEN: 'SET_IS_OPEN',
};

interface IState {
    isOpen: boolean;
}

export default {
    namespaced: true,

    state: (): IState => ({
        isOpen: false,
    }),

    getters: {
        isOpen: (state: IState): boolean => state.isOpen,
    },

    mutations: {
        [TYPES.SET_IS_OPEN](state: IState, isOpen: boolean): void {
            state.isOpen = isOpen;
        },
    },

    actions: {
        setIsOpen({ commit }: { commit: Commit }, isOpen: boolean): void {
            commit(TYPES.SET_IS_OPEN, isOpen);
        },
    },
};
