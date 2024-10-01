const TYPES = {
    SET_ALLOWANCE: 'SET_ALLOWANCE',

    SET_IS_NEED_APPROVE_LP: 'SET_IS_NEED_APPROVE_LP',
    SET_IS_NEED_REMOVE_LP_APPROVE: 'SET_IS_NEED_REMOVE_LP_APPROVE',
};

interface IState {
    allowance: {
        [key: string]: {
            [key: string]: string;
        };
    };
    isNeedApproveLP: boolean;
    isNeedRemoveLpApprove: boolean;
}

export default {
    namespaced: true,

    state: (): IState => ({
        allowance: {},
        isNeedApproveLP: false,
        isNeedRemoveLpApprove: false,
    }),

    getters: {
        getAllowance: (state: IState) => (owner: string, token: string) => {
            if (!owner || !token) return null;

            if (state.allowance && state.allowance[owner]) return state.allowance[owner][token] || null;

            return null;
        },
        isNeedApproveLP: (state: IState) => state.isNeedApproveLP,
        isNeedRemoveLpApprove: (state: IState) => state.isNeedRemoveLpApprove,
    },

    mutations: {
        [TYPES.SET_ALLOWANCE](state: IState, { owner, token, value }: { owner: string; token: string; value: string }) {
            !state.allowance[owner] && (state.allowance[owner] = {});
            state.allowance[owner][token] = value;
        },
        [TYPES.SET_IS_NEED_APPROVE_LP](state: IState, value: boolean) {
            state.isNeedApproveLP = value;
        },
        [TYPES.SET_IS_NEED_REMOVE_LP_APPROVE](state: IState, value: boolean) {
            state.isNeedRemoveLpApprove = value;
        },
    },
    actions: {
        setAllowance({ commit }: { commit: any }, value: { owner: string; token: string; value: string }) {
            commit(TYPES.SET_ALLOWANCE, value);
        },
        setIsNeedApproveLP({ commit }: any, value: boolean) {
            commit(TYPES.SET_IS_NEED_APPROVE_LP, value);
        },
        setIsNeedRemoveLPApprove({ commit }: any, value: boolean) {
            commit(TYPES.SET_IS_NEED_REMOVE_LP_APPROVE, value);
        },
    },
};
