import { flatMap, orderBy, filter } from 'lodash';
import { useLocalStorage } from '@vueuse/core';

import BigNumber from 'bignumber.js';

import { Type } from '@/core/balance-provider/models/enums';
import { getTotalBalance } from '@/core/balance-provider/calculation';

import BalancesDB from '@/services/indexed-db/balances';
import { IAsset } from '@/shared/models/fields/module-fields';

const balancesDB = new BalancesDB(1);

const minBalanceStorage = useLocalStorage('dashboard:minBalance', 0, { mergeDefaults: true });

const BUNDLED_ACCOUNT = 'all';

const MAX_NFTS_PER_PAGE = 10;
const MAX_ASSETS_PER_PAGE = 10;

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

    SET_NEW_TOKEN_IMAGE: 'SET_NEW_TOKEN_IMAGE',
};

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

        [TYPES.SET_NEW_TOKEN_IMAGE](state: IState, { chain, id, image }: { chain: string; id: string; image: string }) {
            if (!state.tokens) return;

            let accountToUpdate = null;

            for (const account in state.tokens) {
                if (!state.tokens[account][chain]) continue;

                const tokens = state.tokens[account][chain] as any;

                if (!tokens?.length) continue;

                const tokenIndex = tokens.findIndex((token: any) => token.id === id);
                if (tokenIndex === -1) continue;

                // eslint-disable-next-line
                // @ts-ignore
                state.tokens[account][chain][tokenIndex].logo = image;
                accountToUpdate = account;
                break;
            }

            if (accountToUpdate) balancesDB.updateTokenImage(accountToUpdate, id, image);
        },
    },

    actions: {
        async loadFromCache(
            { dispatch, state, commit }: { dispatch: any; state: IState; commit: any },
            { account, type }: { account: string; type: string },
        ) {
            try {
                const [balances, totalBalances] = await Promise.all([
                    await balancesDB.getBalancesByAccountAndTypeWithChains(type, account),
                    await balancesDB.getTotalBalance(account),
                ]);

                if (!balances) return;

                for (const chain in balances) {
                    if (!balances[chain]) continue;
                    if (![Type.integrations, Type.nfts].includes(type as any))
                        dispatch('setDataFor', { type, account, chain, data: balances[chain] });
                }

                commit(TYPES.SET_TOTAL_BALANCE, { account, data: totalBalances.total });
                commit(TYPES.SET_ASSETS_BALANCE, { account, data: totalBalances.assetsBalance });
            } catch (error) {
                console.error('loadFromCache', error);
            }
        },
        setDataFor({ commit, getters }: { commit: any; getters: any }, value: { type: string; account: string; chain: string; data: any }) {
            commit(TYPES.SET_DATA_FOR, value);
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

        updateTokenImage({ commit }: { commit: any }, value: { chain: string; id: string; image: string }) {
            commit(TYPES.SET_NEW_TOKEN_IMAGE, value);
        },

        setTotalBalances({ commit }: { commit: any }, value: { account: string; data: number }) {
            commit(TYPES.SET_TOTAL_BALANCE, value);
        },
    },
};
