import { values } from 'lodash';
import { Commit, Dispatch } from 'vuex';

import { getStakeTokens, getDefiAssets } from '@/modules/chain-configs/api';

const TYPES = {
    SET_STAKE_ASSETS: 'SET_STAKE_ASSETS',
    SET_DEFI_ASSETS: 'SET_DEFI_ASSETS',
};

interface IState {
    stakeAssets: any[];
    defiAssets: any[];
}

interface IAssetResponse {
    limit: number;
    offset: number;
    totalPages: number;
    total: number;
    list: any[];
}

export default {
    namespaced: true,

    state: (): IState => ({
        stakeAssets: [],
        defiAssets: [],
    }),

    getters: {
        getStakeAssets: (state: IState) => state.stakeAssets,
        getDeFiAssets: (state: IState) => state.defiAssets,
    },

    mutations: {
        [TYPES.SET_STAKE_ASSETS](state: IState, { list }: IAssetResponse) {
            state.stakeAssets = list;
        },
        [TYPES.SET_DEFI_ASSETS](state: IState, { list }: IAssetResponse) {
            state.defiAssets = list;
        },
    },

    actions: {
        async setStakeTokens({ commit }: { commit: Commit }) {
            try {
                const data = await getStakeTokens();
                commit(TYPES.SET_STAKE_ASSETS, data);
            } catch (error) {
                return {};
            }
        },
        async setDefiAssets({ commit }: { commit: Commit }) {
            try {
                const data = await getDefiAssets();
                commit(TYPES.SET_DEFI_ASSETS, data);
            } catch (error) {
                return {};
            }
        },
    },
};
