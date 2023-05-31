const types = {
    TOGGLE_VIEW_BALANCE: 'TOGGLE_VIEW_BALANCE',
};

export default {
    namespaced: true,
    state: () => ({
        showBalance: true,
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
