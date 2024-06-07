import { flatMap, orderBy, values, filter } from 'lodash';
import { useLocalStorage } from '@vueuse/core';

import BigNumber from 'bignumber.js';

import { IntegrationBalanceType, Type } from '@/core/balance-provider/models/enums';
import { getTotalBalance, getIntegrationsBalance, getTotalBalanceByType, filterSmallBalances } from '@/core/balance-provider/calculation';

import IndexedDBService from '@/services/indexed-db';

const balancesDB = new IndexedDBService('balances', 2);
const minBalanceStorage = useLocalStorage('dashboard:minBalance', 0, { mergeDefaults: true });

const BALANCE_ALLOW_TYPES = ['tokens', 'integrations'];

const BUNDLED_ACCOUNT = 'all';

const TYPES = {
    SET_DATA_FOR: 'SET_DATA_FOR',

    SET_IS_INIT_CALLED: 'SET_IS_INIT_CALLED',

    SET_LOADER: 'SET_LOADER',

    SET_SELECT_TYPE: 'SET_SELECT_TYPE',

    SET_DISABLE_LOADER: 'SET_DISABLE_LOADER',

    SET_ASSETS_BALANCE: 'SET_ASSETS_BALANCE',
    SET_NATIVE_ASSET: 'SET_NATIVE_ASSET',

    SET_LOADING_BY_CHAIN: 'SET_LOADING_BY_CHAIN',

    SET_TOTAL_BALANCE: 'SET_TOTAL_BALANCE',

    CALCULATE_BALANCE_BY_TYPE: 'CALCULATE_BALANCE_BY_TYPE',

    SET_TARGET_ACCOUNT: 'SET_TARGET_ACCOUNT',

    REMOVE_BALANCE_FOR_ACCOUNT: 'REMOVE_BALANCE_FOR_ACCOUNT',

    SET_MIN_BALANCE: 'SET_MIN_BALANCE',
};

export default {
    namespaced: true,

    state: () => ({
        targetAccount: null,

        isInitCalled: {},
        loadingByChain: {},

        loader: false,

        [Type.tokens]: {},
        [Type.integrations]: {},
        [Type.nfts]: {},

        disableLoader: false,

        assetsBalances: {},

        totalBalances: {},

        nativeTokens: {},

        minBalance: minBalanceStorage.value,
    }),

    getters: {
        isInitCalled: (state) => (account) => state.isInitCalled[account] || null,
        loader: (state) => {
            if (JSON.stringify(state.loadingByChain) === '{}') return false;

            for (const account in state.loadingByChain) {
                if (!state.loadingByChain[account]) return false;

                for (const chain in state.loadingByChain[account]) if (state.loadingByChain[account][chain]) return true;
            }

            return false;
        },

        loadingByAccount: (state) => (account) => {
            if (JSON.stringify(state.loadingByChain) === '{}') return false;

            if (!account) return false;

            if (!state.loadingByChain[account]) return false;

            for (const chain in state.loadingByChain[account]) if (state.loadingByChain[account][chain]) return true;

            return false;
        },

        loadingByChain: (state) => (account, chain) => state.loadingByChain[account]?.[chain] || false,

        loadingForChains: (state) => (account) => state.loadingByChain[account] || {},

        targetAccount: (state) => state.targetAccount,

        getAccountBalanceByType:
            (state) =>
            (account, type, allBalances = false) => {
                if (!state[type]) return [];

                if (!state[type][account] && account !== BUNDLED_ACCOUNT) return [];

                if (account === BUNDLED_ACCOUNT) {
                    const allData = [];

                    for (const acc in state[type]) if (state[type][acc]) allData.push(...flatMap(state[type][acc]));

                    return allData;
                }

                const allForAccount = flatMap(state[type][account]) || [];

                if (type === Type.tokens && !allBalances) {
                    const allTokens = filter(allForAccount, (elem) => +elem.balanceUsd >= +state.minBalance);

                    const assetsBalance = getTotalBalance(allTokens);
                    state.assetsBalances[account] = assetsBalance.toNumber() || 0;

                    return allTokens;
                }

                return allForAccount;
            },

        getIntegrationsByPlatforms: (state, getters) => (account) => {
            const allIntegrations = getters.getAccountBalanceByType(account, 'integrations');

            const platforms = allIntegrations.reduce((grouped, integration) => {
                const { platform, type, balances = [], logo = null, healthRate = null, leverageRate } = integration;

                const filteredBalances = balances.filter((elem) => filterSmallBalances(elem, state.minBalance));

                if (!filteredBalances.length) return grouped;

                if (!grouped[platform])
                    grouped[platform] = {
                        data: [],
                        platform,
                        healthRate: healthRate || null,
                        logoURI: logo || null,
                        totalGroupBalance: 0,
                        totalRewardsBalance: 0,
                    };

                const platformData = grouped[platform];

                platformData.data.push({ ...integration, balances: filteredBalances });
                platformData.healthRate = healthRate || null;
                platformData.logoURI = logo || null;

                for (const balance of filteredBalances) balance.leverageRate = leverageRate || null;

                platformData.totalGroupBalance = BigNumber(platformData.totalGroupBalance)
                    .plus(getTotalBalanceByType(filteredBalances, type))
                    .toString();

                platformData.totalRewardsBalance = BigNumber(platformData.totalRewardsBalance)
                    .plus(getTotalBalanceByType(filteredBalances, IntegrationBalanceType.PENDING))
                    .toString();

                return grouped;
            }, {});

            return orderBy(values(platforms), (integration) => +integration?.totalGroupBalance || 0, ['desc']);
        },

        getNFTsByCollection: (state, getters) => (account) => {
            const allNFTs = getters.getAccountBalanceByType(account, 'nfts');

            const collections = allNFTs.reduce((grouped, nft) => {
                const { collection = {}, token = {}, chainLogo } = nft || {};

                const { address } = collection || {};

                if (!grouped[address])
                    grouped[address] = {
                        ...collection,
                        chainLogo,
                        token,
                        nfts: [],
                        floorPriceUsd: BigNumber(0),
                        totalGroupBalance: BigNumber(0),
                    };

                const collectionData = grouped[address];

                collectionData.totalGroupBalance = BigNumber(nft.price || 0)
                    .multipliedBy(token.price || 0)
                    .toString();

                collectionData.floorPriceUsd = BigNumber(collection.floorPrice || 0)
                    .multipliedBy(token.price || 0)
                    .toString();

                if (+collectionData.floorPriceUsd >= +state.minBalance) collectionData.nfts.push(nft);

                return grouped;
            }, {});

            return orderBy(
                values(collections).filter((elem) => elem.nfts.length),
                (collection) => +collection?.totalGroupBalance || 0,
                ['desc'],
            );
        },

        nativeTokens: (state) => state.nativeTokens,

        getTokensListForChain:
            (state) =>
            (chain, { account = null } = {}) => {
                if (!state.tokens[account] || !chain) return [];

                return state.tokens[account][chain] || [];
            },

        getNativeTokenForChain: (state) => (account, chain) => {
            if (!state.nativeTokens[account] || !state.nativeTokens[account][chain]) return null;

            return state.nativeTokens[account][chain] || null;
        },

        disableLoader: (state) => state.disableLoader,

        totalBalances: (state) => state.totalBalances,
        assetsBalances: (state) => state.assetsBalances,
        minBalance: (state) => state.minBalance,

        getTotalBalanceByType: (state) => (account, balanceType) => {
            if (!state[balanceType]) return 0;

            if (account === BUNDLED_ACCOUNT) {
                let total = BigNumber(0);

                for (const acc in state[balanceType]) total = total.plus(state[balanceType][acc] || 0);

                return total.toString() || 0;
            }

            return state[balanceType][account] || 0;
        },
    },

    mutations: {
        [TYPES.SET_DATA_FOR](state, { type, account, chain, data }) {
            !state[type] && (state[type] = {});
            !state[type][account] && (state[type][account] = {});
            !state[type][account][chain] && (state[type][account][chain] = {});

            if (type === Type.tokens)
                data = data.filter((token) => BigNumber(token.balance).toFixed(8, BigNumber.ROUND_DOWN) !== '0.00000000');

            return (state[type][account][chain] = data);
        },

        [TYPES.SET_ASSETS_BALANCE](state, { account, data }) {
            if (!state.assetsBalances[account]) state.assetsBalances[account] = {};

            state.assetsBalances[account] = data;
        },

        [TYPES.SET_TOTAL_BALANCE](state, { account, data }) {
            if (!state.totalBalances[account]) state.totalBalances[account] = {};

            state.totalBalances[account] = data;
        },

        [TYPES.SET_DISABLE_LOADER](state, value) {
            state.disableLoader = value;
        },

        [TYPES.SET_LOADER](state, value) {
            state.loader = value;
        },

        [TYPES.SET_LOADING_BY_CHAIN](state, { account, chain, value }) {
            !state.loadingByChain[account] && (state.loadingByChain[account] = {});
            !state.loadingByChain[account][chain] && (state.loadingByChain[account][chain] = false);
            state.loadingByChain[account][chain] = value || false;
        },

        [TYPES.CALCULATE_BALANCE_BY_TYPE](state, { value, getters }) {
            const { account, type } = value;

            // calculating balances
            if (!state.assetsBalances[account]) state.assetsBalances[account] = 0;

            if (!state.totalBalances[account]) state.totalBalances[account] = 0;

            const allTokens = getters.getAccountBalanceByType(account, Type.tokens, type === Type.tokens);
            const allIntegrations = getters.getAccountBalanceByType(account, Type.integrations);

            if (BALANCE_ALLOW_TYPES.includes(type)) {
                const assetsBalance = getTotalBalance(allTokens);

                const integrationsBalance = getIntegrationsBalance(allIntegrations);

                const totalBalance = BigNumber(assetsBalance).plus(integrationsBalance).toNumber();

                state.totalBalances[account] = totalBalance;
            }
        },
        [TYPES.SET_IS_INIT_CALLED](state, { account, time }) {
            if (!state.isInitCalled[account]) state.isInitCalled[account] = null;

            state.isInitCalled[account] = time;
        },
        [TYPES.SET_TARGET_ACCOUNT](state, value) {
            state.targetAccount = value;
        },
        [TYPES.REMOVE_BALANCE_FOR_ACCOUNT](state, account) {
            state.isInitCalled[account] && delete state.isInitCalled[account];
            state.tokens[account] && delete state.tokens[account];
            state.integrations[account] && delete state.integrations[account];
            state.nfts[account] && delete state.nfts[account];
            state.assetsBalances[account] && delete state.assetsBalances[account];
            state.totalBalances[account] && delete state.totalBalances[account];
        },
        [TYPES.SET_MIN_BALANCE](state, value) {
            state.minBalance = value;
        },
    },

    actions: {
        async loadFromCache({ dispatch }, { account, chain, address, type }) {
            const balances = await balancesDB.getBalancesByType('balances', { account, chain, address, type });

            if (!balances) return;

            dispatch('setDataFor', { type, account, chain, data: balances });
        },
        setDataFor({ commit, getters }, value) {
            commit(TYPES.SET_DATA_FOR, value);

            if (BALANCE_ALLOW_TYPES.includes(value.type)) commit(TYPES.CALCULATE_BALANCE_BY_TYPE, { value, getters });
        },
        setLoader({ commit }, value) {
            commit(TYPES.SET_LOADER, value);
        },
        setDisableLoader({ commit }, value) {
            commit(TYPES.SET_DISABLE_LOADER, value);
        },
        setAssetsBalances({ commit }, value) {
            commit(TYPES.SET_ASSETS_BALANCE, value);
        },
        setLoadingByChain({ commit }, value) {
            commit(TYPES.SET_LOADING_BY_CHAIN, value);
        },
        setNativeTokenByChain({ commit }, value) {
            commit(TYPES.SET_NATIVE_ASSET, value);
        },
        setIsInitCall({ commit }, value) {
            commit(TYPES.SET_IS_INIT_CALLED, value);
        },
        setTargetAccount({ commit }, value) {
            commit(TYPES.SET_TARGET_ACCOUNT, value);
        },
        removeBalanceForAccount({ commit }, value) {
            commit(TYPES.REMOVE_BALANCE_FOR_ACCOUNT, value);
        },
        setMinBalance({ commit }, value) {
            commit(TYPES.SET_MIN_BALANCE, value);
            minBalanceStorage.value = value;
        },
    },
};
