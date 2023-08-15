const types = {
    TOGGLE_MODAL: 'TOGGLE_MODAL',
};

export default {
    namespaced: true,
    state: () => ({
        isOpen: false,
        name: '',
    }),

    getters: {
        showBalance: (state) => state.showBalance,
    },

    mutations: {
        [types.TOGGLE_VIEW_BALANCE](state) {
            state.showBalance = !state.showBalance;
        },
    },

    actions: {
        toggleViewBalance({ commit }) {
            commit(types.TOGGLE_VIEW_BALANCE);
        },
    },
};
