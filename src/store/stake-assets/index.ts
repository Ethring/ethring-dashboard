import { values } from 'lodash';
import { Commit, Dispatch } from 'vuex';

import { getStakeTokens, getCategories, getChains, getProtocols } from '@/modules/chain-configs/api';

const TYPES = {
    SET_STAKE_ASSETS: 'SET_STAKE_ASSETS',
    SET_DEFI_ASSETS: 'SET_DEFI_ASSETS',

    // FILTERS

    SET_IS_ALL_CHAINS: 'SET_IS_ALL_CHAINS',

    SET_CATEGORIES: 'SET_CATEGORIES',
    SET_CHAINS: 'SET_CHAINS',
    SET_PROTOCOLS: 'SET_PROTOCOLS',

    SET_FILTERS: 'SET_FILTERS',
};

interface IState {
    stakeAssets: any[];
    defiAssets: any[];

    // FILTERS
    categories: any[];
    chains: any[];
    protocols: any[];

    filters: {
        isAllChains: boolean;
        onlyWithRewards: boolean;
        categories: string[];
        chains: string[];
        protocols: string[];
        tvl: number[];
        apy: number[];
    };
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

        // FILTERS
        categories: [],
        chains: [],
        protocols: [],

        filters: {
            isAllChains: false,
            onlyWithRewards: false,

            categories: [],
            chains: [],
            protocols: [],

            tvl: [0, 0],
            apy: [0, 0],
        },
    }),

    getters: {
        getTotalCountOfFilters: (state: IState) => {
            let count = 0;

            const [minTvl, maxTvl] = state.filters.tvl || [];
            const [minApy, maxApy] = state.filters.apy || [];

            if (state.filters.onlyWithRewards) count += 1;

            if (minTvl && maxTvl) count += 1;
            if (minApy && maxApy) count += 1;

            count += state.filters.chains.length;
            count += state.filters.protocols.length;
            count += state.filters.categories.length;

            return count;
        },

        getMaxTvl: (state: IState) => {
            console.log('MAX TVL', Math.max(...state.stakeAssets.map((asset) => asset.tvl)));
            return Math.max(...state.stakeAssets.map((asset) => asset.tvl));
        },
        getStakeAssets: (state: IState) => {
            if (state.filters) {
                const filteredAssets = state.stakeAssets.filter((asset) => {
                    const matchesRewards = !state.filters.onlyWithRewards || asset.rewards.length > 0;
                    const matchesCategories = !state.filters.categories.length || state.filters.categories.includes(asset.category?.id);
                    const matchesChains = !state.filters.chains.length || state.filters.chains.includes(asset.chain);
                    const matchesProtocols = !state.filters.protocols.length || state.filters.protocols.includes(asset.protocol.id);
                    // const matchesTvl = asset.tvl >= state.filters.tvl.min && asset.tvl <= state.filters.tvl.max;
                    // const matchesApy = asset.apy >= state.filters.apy.min && asset.apy <= state.filters.apy.max;

                    return matchesRewards && matchesCategories && matchesChains && matchesProtocols;
                    // matchesRewards  && matchesTvl && matchesApy;
                });

                return filteredAssets;
            }

            return state.stakeAssets;
        },

        // FILTERS
        getCategories: (state: IState) => state.categories,
        getChains: (state: IState) => state.chains,
        getProtocols: (state: IState) => state.protocols,

        getFilters: (state: IState) => state.filters,
    },

    mutations: {
        [TYPES.SET_STAKE_ASSETS](state: IState, { list }: IAssetResponse) {
            state.stakeAssets = list;
        },

        // FILTERS
        [TYPES.SET_CATEGORIES](state: IState, value: any) {
            state.categories = value;
        },
        [TYPES.SET_CHAINS](state: IState, value: any) {
            state.chains = value;
        },
        [TYPES.SET_PROTOCOLS](state: IState, value: any) {
            state.protocols = value;
        },

        [TYPES.SET_FILTERS](state: IState, filters: any) {
            state.filters = filters;
        },

        [TYPES.SET_IS_ALL_CHAINS](state: IState, value: boolean) {
            state.filters.isAllChains = value;
            state.filters.chains = value ? state.chains.map((chain: any) => chain.net) : [];
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
        // FILTERS

        async setCategories({ commit }: { commit: Commit }) {
            try {
                const data = await getCategories();
                commit(TYPES.SET_CATEGORIES, data);
            } catch (error) {
                return {};
            }
        },

        async setChains({ commit }: { commit: Commit }) {
            try {
                const data = await getChains();
                commit(TYPES.SET_CHAINS, data);
            } catch (error) {
                return {};
            }
        },

        async setProtocols({ commit }: { commit: Commit }) {
            try {
                const data = await getProtocols();
                commit(TYPES.SET_PROTOCOLS, data);
            } catch (error) {
                return {};
            }
        },

        setFilters({ commit }: { commit: Commit }, filters: any) {
            commit(TYPES.SET_FILTERS, filters);
        },

        resetFilters({ commit }: { commit: Commit }) {
            commit(TYPES.SET_FILTERS, {
                onlyWithRewards: false,
                isAllChains: false,
                categories: [],
                chains: [],
                protocols: [],
                tvl: [0, 0],
                apy: [0, 0],
            });
        },

        setIsAllChains({ commit }: { commit: Commit }, value: boolean) {
            commit(TYPES.SET_IS_ALL_CHAINS, value);
        },
    },
};
