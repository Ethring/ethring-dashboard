import { flatMap, orderBy, values, filter } from 'lodash';
import { useLocalStorage } from '@vueuse/core';

import BigNumber from 'bignumber.js';

import { IntegrationBalanceType, Type } from '@/core/balance-provider/models/enums';
import { getTotalBalance, getIntegrationsBalance, getTotalBalanceByType, filterSmallBalances } from '@/core/balance-provider/calculation';

import IndexedDBService from '@/services/indexed-db';
import { IAsset } from '@/shared/models/fields/module-fields';
import { AssetBalance, IntegrationBalance, NftBalance } from '@/core/balance-provider/models/types';

const balancesDB = new IndexedDBService('balances', 3);
const minBalanceStorage = useLocalStorage('dashboard:minBalance', 0, { mergeDefaults: true });

const BALANCE_ALLOW_TYPES = ['tokens', 'integrations'];

const BUNDLED_ACCOUNT = 'all';

const TYPES = {
    SET_DATA_FOR: 'SET_DATA_FOR',

    SET_IS_INIT_CALLED: 'SET_IS_INIT_CALLED',
    RESET_IS_INIT_CALL: 'RESET_IS_INIT_CALL',

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

    SET_NETWORKS_TO_SHOW: 'SET_NETWORKS_TO_SHOW',

    SET_ASSET_INDEX: 'SET_ASSET_INDEX',
    SET_NFT_INDEX: 'SET_NFT_INDEX',
};

const MAX_NFTS_PER_PAGE = 5;
const MAX_ASSETS_PER_PAGE = 10;

interface IState {
    // Account for which the data is loaded
    targetAccount: string | null;
    minBalance: number;

    isInitCalled: Record<string, number | null>;

    loader: boolean;
    disableLoader: boolean;
    loadingByChain: Record<string, Record<string, boolean>>;

    assetsBalances: Record<string, number>;
    totalBalances: Record<string, number>;

    // Pagination for assets and nfts
    assetIndex: number;
    nftIndex: number;

    nativeTokens: Record<string, Record<string, any>>;

    // Feat: filter by isShowNetworks
    networksToShow: Record<string, boolean>;

    [Type.tokens]: Record<string, Record<string, Record<string, any[]>>>;
    [Type.integrations]: Record<string, Record<string, Record<string, any[]>>>;
    [Type.nfts]: Record<string, Record<string, Record<string, any[]>>>;
    [Type.pools]: Record<string, Record<string, Record<string, any[]>>>;
}

export default {
    namespaced: true,

    state: (): IState => ({
        targetAccount: null,

        isInitCalled: {},
        loadingByChain: {},

        loader: false,

        [Type.tokens]: {},
        [Type.integrations]: {},
        [Type.nfts]: {},
        [Type.pools]: {},

        disableLoader: false,

        assetsBalances: {},

        totalBalances: {},

        assetIndex: MAX_ASSETS_PER_PAGE,
        nftIndex: MAX_NFTS_PER_PAGE,

        nativeTokens: {},

        networksToShow: {},

        minBalance: minBalanceStorage.value,
    }),

    getters: {
        nftIndex: (state: IState) => state.nftIndex || MAX_NFTS_PER_PAGE,
        assetIndex: (state: IState) => state.assetIndex || MAX_ASSETS_PER_PAGE,

        isInitCalled: (state: IState) => (account: string, provider: string) => {
            const key = `${account}-${provider}`;
            return state.isInitCalled[key] || null;
        },
        loader: (state: IState) => {
            if (JSON.stringify(state.loadingByChain) === '{}') return false;

            for (const account in state.loadingByChain) {
                if (!state.loadingByChain[account]) return false;

                for (const chain in state.loadingByChain[account]) {
                    if (!state.loadingByChain[account][chain]) continue;
                    return true;
                }
            }

            return false;
        },

        loadingByAccount: (state: IState) => (account: string) => {
            if (JSON.stringify(state.loadingByChain) === '{}') return false;

            if (!account) return false;

            if (!state.loadingByChain[account]) return false;

            for (const chain in state.loadingByChain[account]) if (state.loadingByChain[account][chain]) return true;

            return false;
        },

        loadingByChain: (state: IState) => (account: string, chain: string) => state.loadingByChain[account]?.[chain] || false,

        loadingForChains: (state: IState) => (account: string) => state.loadingByChain[account] || {},

        targetAccount: (state: IState) => state.targetAccount,

        getPoolsByAccount: (state: IState) => (account: string) => state.pools[account],

        getAccountBalanceByType:
            (state: IState) =>
            (account: string, type: keyof typeof Type, allBalances: boolean = false) => {
                if (!state[type]) return [];

                if (!state[type][account] && account !== BUNDLED_ACCOUNT) return [];

                if (account === BUNDLED_ACCOUNT) {
                    const allData = [];

                    for (const acc in state[type]) if (state[type][acc]) allData.push(...flatMap(state[type][acc]));

                    return allData;
                }

                const allForAccount = flatMap(state[type][account]) || [];

                // FEAT: filter by isShowNetworks
                // const tokensFilteredByIsShow = allForAccount.filter((elem) => {
                //     if (!state.networksToShow) return true;
                //     return state.networksToShow[elem.chain];
                // });

                if (type === Type.tokens && !allBalances) {
                    // const allTokens = filter(tokensFilteredByIsShow, (elem) => +elem.balanceUsd >= +state.minBalance);
                    const allTokens = filter(allForAccount, (elem) => +elem.balanceUsd >= +state.minBalance);

                    const assetsBalance = getTotalBalance(allTokens);
                    state.assetsBalances[account] = assetsBalance.toNumber() || 0;

                    return allTokens;
                }

                // return tokensFilteredByIsShow;
                return allForAccount;
            },

        getIntegrationsByPlatforms: (state: IState, getters: any) => (account: string) => {
            const allIntegrations = getters.getAccountBalanceByType(account, 'integrations');

            const platforms = allIntegrations.reduce((grouped: any, integration: IntegrationBalance) => {
                const { platform, type, balances = [], logo = null, healthRate = null, leverageRate } = integration;

                const filteredBalances = balances.filter((elem: any) => filterSmallBalances(elem, state.minBalance));

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
                    .plus(getTotalBalanceByType(filteredBalances as AssetBalance[], type as IntegrationBalanceType))
                    .toString();

                platformData.totalRewardsBalance = BigNumber(platformData.totalRewardsBalance)
                    .plus(getTotalBalanceByType(filteredBalances as AssetBalance[], IntegrationBalanceType.PENDING))
                    .toString();

                return grouped;
            }, {});

            return orderBy(values(platforms), (integration) => +integration?.totalGroupBalance || 0, ['desc']);
        },

        getNFTsByCollection: (state: IState, getters: any) => (account: string) => {
            const allNFTs = getters.getAccountBalanceByType(account, 'nfts');

            const collections = allNFTs.reduce((grouped: any, nft: NftBalance) => {
                const { collection, token, chainLogo } = nft || {};

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

        getVisibleNFTs: (state: IState, getters: any) => (account: string) => {
            const allNFTs = getters.getNFTsByCollection(account);
            return orderBy(allNFTs, (nft) => +nft.price || 0, ['desc']).slice(0, state.nftIndex);
        },

        getVisibleAssets: (state: IState, getters: any) => (account: string) => {
            const allTokens = getters.getAccountBalanceByType(account, 'tokens') || [];
            return orderBy(allTokens, (token) => +token.balanceUsd || 0, ['desc']).slice(0, state.assetIndex);
        },

        getCountOfBalances: (state: IState, getters: any) => (account: string, type: keyof typeof Type) => {
            switch (type) {
                case 'nfts':
                    return getters.getNFTsByCollection(account).length;
                case 'tokens':
                    return getters.getAccountBalanceByType(account, type).length;
                case 'integrations':
                    return getters.getAccountBalanceByType(account, type).length;
                default:
                    return 0;
            }
        },

        nativeTokens: (state: IState) => state.nativeTokens,

        getTokensListForChain:
            (state: IState) =>
            (chain: string, { account = null }: { account: string | null }) => {
                if (!account) return [];
                if (!state.tokens[account] || !chain) return [];
                return state.tokens[account][chain] || [];
            },

        getNativeTokenForChain: (state: IState) => (account: string, chain: string) => {
            if (!state.nativeTokens[account] || !state.nativeTokens[account][chain]) return null;

            return state.nativeTokens[account][chain] || null;
        },

        disableLoader: (state: IState) => state.disableLoader,

        totalBalances: (state: IState) => state.totalBalances,
        assetsBalances: (state: IState) => state.assetsBalances,
        minBalance: (state: IState) => state.minBalance,

        getTotalBalanceByType: (state: IState) => (account: string, balanceType: keyof typeof Type) => {
            if (!state[balanceType]) return 0;

            if (account === BUNDLED_ACCOUNT) {
                let total = BigNumber(0);

                for (const acc in state[balanceType]) total = total.plus(state[balanceType][acc] as any);

                return total.toString() || 0;
            }

            return state[balanceType][account] || 0;
        },

        getTotalBalanceOfNFTs: (state: IState, getters: any) => (account: string) => {
            const allNFTsByCollection = getters.getNFTsByCollection(account);

            if (!allNFTsByCollection.length) return 0;

            const totalSum = allNFTsByCollection.reduce((totalBalance: BigNumber, collection: any) => {
                return totalBalance.plus(collection.totalGroupBalance || 0);
            }, BigNumber(0));

            return totalSum.toNumber();
        },

        networksToShow: (state: IState) => state.networksToShow || {},
    },

    mutations: {
        [TYPES.SET_DATA_FOR](
            state: IState,
            { type, account, chain, data }: { type: keyof typeof Type; account: string; chain: string; data: any },
        ) {
            !state[type] && (state[type] = {});
            !state[type][account] && (state[type][account] = {});
            !state[type][account][chain] && (state[type][account][chain] = {});

            if (type === Type.tokens)
                data = data.filter((token: IAsset) => BigNumber(token.balance).toFixed(8, BigNumber.ROUND_DOWN) !== '0.00000000');

            return (state[type][account][chain] = data);
        },

        [TYPES.SET_ASSETS_BALANCE](state: IState, { account, data }: { account: string; data: any }) {
            !state.assetsBalances && (state.assetsBalances = {});
            !state.assetsBalances[account] && (state.assetsBalances[account] = 0);
            state.assetsBalances[account] = data;
        },

        [TYPES.SET_TOTAL_BALANCE](state: IState, { account, data }: { account: string; data: number }) {
            !state.totalBalances && (state.totalBalances = {});
            !state.totalBalances[account] && (state.totalBalances[account] = 0);

            state.totalBalances[account] = data;
        },

        [TYPES.SET_DISABLE_LOADER](state: IState, value: boolean) {
            state.disableLoader = value;
        },

        [TYPES.SET_LOADER](state: IState, value: boolean) {
            state.loader = value;
        },

        [TYPES.SET_LOADING_BY_CHAIN](state: IState, { account, chain, value }: { account: string; chain: string; value: boolean }) {
            !state.loadingByChain[account] && (state.loadingByChain[account] = {});
            !state.loadingByChain[account][chain] && (state.loadingByChain[account][chain] = false);
            state.loadingByChain[account][chain] = value || false;
        },

        [TYPES.CALCULATE_BALANCE_BY_TYPE](state: IState, { value, getters }: { value: any; getters: any }) {
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
        [TYPES.SET_IS_INIT_CALLED](state: IState, { account, provider, time }: { account: string; provider: string; time: number }) {
            const key = `${account}-${provider}`;

            !state.isInitCalled && (state.isInitCalled = {});
            !state.isInitCalled[key] && (state.isInitCalled[key] = null);
            state.isInitCalled[key] = time;
        },
        [TYPES.RESET_IS_INIT_CALL](state: IState, { account, provider, isAll }: { account: string; provider: string; isAll?: boolean }) {
            if (isAll) return (state.isInitCalled = {});

            const key = `${account}-${provider}`;
            state.isInitCalled[key] && delete state.isInitCalled[key];
        },
        [TYPES.SET_TARGET_ACCOUNT](state: IState, value: string) {
            state.targetAccount = value;
        },
        [TYPES.REMOVE_BALANCE_FOR_ACCOUNT](state: IState, account: string) {
            state.isInitCalled[account] && delete state.isInitCalled[account];
            state.tokens[account] && delete state.tokens[account];
            state.integrations[account] && delete state.integrations[account];
            state.nfts[account] && delete state.nfts[account];
            state.assetsBalances[account] && delete state.assetsBalances[account];
            state.totalBalances[account] && delete state.totalBalances[account];
        },
        [TYPES.SET_MIN_BALANCE](state: IState, value: number) {
            state.minBalance = value;
        },
        [TYPES.SET_NETWORKS_TO_SHOW](state: IState, { network, isShow = false }: { network: string; isShow: boolean }) {
            !state.networksToShow && (state.networksToShow = {});
            !state.networksToShow[network] && (state.networksToShow[network] = false);
            state.networksToShow[network] = isShow;
        },
        [TYPES.SET_ASSET_INDEX](state: IState, value: number) {
            state.assetIndex = value;
        },
        [TYPES.SET_NFT_INDEX](state: IState, value: number) {
            state.nftIndex = value;
        },
    },

    actions: {
        async loadFromCache(
            { dispatch }: { dispatch: any },
            { account, chain, address, type }: { account: string; chain: string; address: string; type: string },
        ) {
            const balances = await balancesDB.getBalancesByType('balances', { account, chain, address, type });

            if (!balances) return;

            dispatch('setDataFor', { type, account, chain, data: balances });
        },
        setDataFor({ commit, getters }: { commit: any; getters: any }, value: { type: string; account: string; chain: string; data: any }) {
            commit(TYPES.SET_DATA_FOR, value);

            if (BALANCE_ALLOW_TYPES.includes(value.type)) commit(TYPES.CALCULATE_BALANCE_BY_TYPE, { value, getters });
        },
        setLoader({ commit }: { commit: any }, value: boolean) {
            commit(TYPES.SET_LOADER, value);
        },
        setDisableLoader({ commit }: { commit: any }, value: boolean) {
            commit(TYPES.SET_DISABLE_LOADER, value);
        },
        setAssetsBalances({ commit }: { commit: any }, value: { account: string; data: any }) {
            commit(TYPES.SET_ASSETS_BALANCE, value);
        },
        setLoadingByChain({ commit }: { commit: any }, value: { account: string; chain: string; value: boolean }) {
            commit(TYPES.SET_LOADING_BY_CHAIN, value);
        },
        setNativeTokenByChain({ commit }: { commit: any }, value: { account: string; chain: string; data: any }) {
            commit(TYPES.SET_NATIVE_ASSET, value);
        },
        setIsInitCall({ commit }: { commit: any }, value: { account: string; provider: string; time: number }) {
            commit(TYPES.SET_IS_INIT_CALLED, value);
        },
        resetIsInitCall({ commit }: { commit: any }, value: { account: string; provider: string; isAll?: boolean }) {
            commit(TYPES.RESET_IS_INIT_CALL, value);
        },
        setTargetAccount({ commit }: { commit: any }, value: string) {
            commit(TYPES.SET_TARGET_ACCOUNT, value);
        },
        removeBalanceForAccount({ commit }: { commit: any }, value: string) {
            commit(TYPES.REMOVE_BALANCE_FOR_ACCOUNT, value);
        },
        setMinBalance({ commit }: { commit: any }, value: number) {
            commit(TYPES.SET_MIN_BALANCE, value);
            minBalanceStorage.value = value;
        },
        setNetworksToShow({ commit }: { commit: any }, value: { network: string; isShow: boolean }) {
            commit(TYPES.SET_NETWORKS_TO_SHOW, value);
        },
        loadMoreAssets({ state, commit }: { state: IState; commit: any }) {
            commit(TYPES.SET_ASSET_INDEX, state.assetIndex + MAX_ASSETS_PER_PAGE);
        },

        loadMoreNFTs({ state, commit }: { state: IState; commit: any }) {
            commit(TYPES.SET_NFT_INDEX, state.nftIndex + MAX_NFTS_PER_PAGE);
        },

        resetIndexes(
            { commit }: { commit: any },
            { resetAssets, resetNFTs }: { resetAssets?: boolean; resetNFTs?: boolean } = {
                resetAssets: true,
                resetNFTs: true,
            },
        ) {
            if (resetAssets) commit(TYPES.SET_ASSET_INDEX, MAX_ASSETS_PER_PAGE);
            if (resetNFTs) commit(TYPES.SET_NFT_INDEX, MAX_NFTS_PER_PAGE);
        },
    },
};
