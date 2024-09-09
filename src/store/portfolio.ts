// import { flatMap, orderBy, filter, values } from 'lodash';
// import { useLocalStorage } from '@vueuse/core';

// import BigNumber from 'bignumber.js';

// import { IntegrationBalanceType, Type } from '@/core/balance-provider/models/enums';
// import { filterSmallBalances, getTotalBalance, getTotalBalanceByType } from '@/core/balance-provider/calculation';

// import BalancesDB from '@/services/indexed-db/balances';
// import { IAsset } from '@/shared/models/fields/module-fields';
// import { IntegrationBalance, NftBalance } from '@/core/balance-provider/models/types';
// import { AssetBalance } from '../core/balance-provider/models/types';

// const balancesDB = new BalancesDB(1);

// const minBalanceStorage = useLocalStorage('dashboard:minBalance', 0, { mergeDefaults: true });

// const MAX_NFTS_PER_PAGE = 10;
// const MAX_ASSETS_PER_PAGE = 10;

// const TYPES = {
//     SET_DATA_FOR: 'SET_DATA_FOR',

//     SET_ASSETS_LIST: 'SET_ASSETS_LIST',
//     SET_NFTS_LIST: 'SET_NFTS_LIST',
//     SET_INTEGRATIONS_LIST: 'SET_INTEGRATIONS_LIST',

//     SET_ASSETS_FOR_ACCOUNT: 'SET_ASSETS_FOR_ACCOUNT',
//     SET_NFTS_BY_COLLECTION: 'SET_NFTS_BY_COLLECTION',
//     SET_INTEGRATIONS_BY_PLATFORM: 'SET_INTEGRATIONS_BY_PLATFORM',
// };

// interface IState {
//     assetsList: Record<string, Record<string, any>>;
//     nftsList: Record<string, Record<string, any>>;
//     integrationsList: Record<string, Record<string, any>>;
// }

// export default {
//     namespaced: true,

//     state: (): IState => ({
//         assetsList: {},
//         nftsList: {},
//         integrationsList: {},
//     }),

//     getters: {
//         getAssetsForAccount:
//             (state: IState) =>
//             (account: string, minBalance: number, index: number = MAX_ASSETS_PER_PAGE) => {
//                 if (!state.assetsList[account]) return { list: [], total: 0, totalBalance: '0' };
//                 let totalBalance = BigNumber(0);

//                 for (const asset in state.assetsList[account]) {
//                     if (!filterSmallBalances(state.assetsList[account][asset], minBalance)) continue;
//                     totalBalance = totalBalance.plus(state.assetsList[account][asset].balanceUsd || 0);
//                 }

//                 return {
//                     list: orderBy(values(state.assetsList[account]), ['balanceUsd'], ['desc']).slice(0, index),
//                     total: values(state.assetsList[account]).length,
//                     totalBalance: totalBalance.toFixed(),
//                 };
//             },
//         getIntegrationByPlatform: (state: IState) => (account: string, minBalance: number) => {
//             if (!state.integrationsList[account]) return { list: [], total: 0, totalBalance: '0' };

//             const byPlatforms: any = {};

//             let totalBalance = BigNumber(0);

//             for (const integration in state.integrationsList[account]) {
//                 const {
//                     platform,
//                     type,
//                     balances = [],
//                     logo = null,
//                     healthRate = null,
//                     leverageRate,
//                 } = state.integrationsList[account][integration];

//                 const filteredBalances = balances.filter((elem: any) => filterSmallBalances(elem, minBalance));

//                 if (!filteredBalances.length) continue;

//                 if (!byPlatforms[platform])
//                     byPlatforms[platform] = {
//                         data: [],
//                         platform,
//                         healthRate: healthRate || null,
//                         logoURI: logo || null,
//                         totalGroupBalance: 0,
//                         totalRewardsBalance: 0,
//                     };

//                 byPlatforms[platform].data.push({ ...state.integrationsList[account][integration], balances: filteredBalances });
//                 byPlatforms[platform].healthRate = healthRate || null;
//                 byPlatforms[platform].logoURI = logo || null;

//                 for (const balance of filteredBalances) balance.leverageRate = leverageRate || null;

//                 byPlatforms[platform].totalGroupBalance = BigNumber(byPlatforms[platform].totalGroupBalance)
//                     .plus(getTotalBalanceByType(filteredBalances as AssetBalance[], type as IntegrationBalanceType))
//                     .toString();

//                 byPlatforms[platform].totalRewardsBalance = BigNumber(byPlatforms[platform].totalRewardsBalance)
//                     .plus(getTotalBalanceByType(filteredBalances as AssetBalance[], IntegrationBalanceType.PENDING))
//                     .toString();

//                 totalBalance = totalBalance.plus(byPlatforms[platform].totalGroupBalance);
//             }

//             return {
//                 list: orderBy(values(byPlatforms), (platform) => +platform.totalGroupBalance || 0, ['desc']),
//                 total: values(byPlatforms).length,
//                 totalBalance: totalBalance.toString(),
//             };
//         },

//         getNfsForAccount:
//             (state: IState) =>
//             (account: string, minBalance: number, index: number = MAX_NFTS_PER_PAGE) => {
//                 if (!state.nftsList[account]) return { list: [], total: 0, totalBalance: '0' };

//                 const collections: any = {};
//                 let totalBalance = BigNumber(0);

//                 for (const nft in state.nftsList[account]) {
//                     const { collection, token, chainLogo, price } = state.nftsList[account][nft] || {};
//                     const { address } = collection || {};

//                     if (!collections[address])
//                         collections[address] = {
//                             ...collection,
//                             chainLogo,
//                             token,
//                             floorPriceUsd: BigNumber(0),
//                             totalGroupBalance: BigNumber(0),
//                         };

//                     collections[address].totalGroupBalance = BigNumber(price || 0)
//                         .multipliedBy(token.price || 0)
//                         .toString();

//                     // if (BigNumber(acc.group.get(address).floorPriceUsd).isGreaterThanOrEqualTo(minBalance))
//                     //     acc.group.get(address).nfts.push(nft);
//                     collections[address].floorPriceUsd = BigNumber(collection.floorPrice || 0)
//                         .multipliedBy(token.price || 0)
//                         .toString();
//                     // if (!acc.group.get(address).nfts.length) acc.group.delete(address);

//                     totalBalance = totalBalance.plus(collections[address].totalGroupBalance);
//                 }

//                 return {
//                     list: orderBy(values(collections), (nft) => +nft.totalGroupBalance || 0, ['desc']).slice(0, index),
//                     total: values(collections).length,
//                     totalBalance: totalBalance.toString(),
//                 };
//             },

//         getNftsByCollection: (state: IState) => (account: string, collection: string, minBalance: number) => {
//             const nftsList = state.nftsList[account] || [];
//             const nfts = [...nftsList.values()];

//             const nftsByCollection = nfts.filter((nft: NftBalance) => nft.collection.address === collection);

//             if (!nftsByCollection) return [];

//             return nftsByCollection;
//         },
//     },

//     mutations: {
//         [TYPES.SET_DATA_FOR](state: IState, { type, account, data }: { type: string; account: string; data: any }) {
//             console.log('SET_DATA_FOR', type, account, data);
//         },

//         [TYPES.SET_ASSETS_LIST](state: IState, { account, data }: { account: string; data: IAsset[] }) {
//             !state.assetsList[account] && (state.assetsList[account] = {});
//             for (const asset of data) state.assetsList[account][asset.id] = asset;
//         },

//         [TYPES.SET_NFTS_LIST](state: IState, { account, data }: { account: string; data: any[] }) {
//             !state.nftsList[account] && (state.nftsList[account] = {});
//             for (const nft of data) state.nftsList[account][nft.id] = nft;
//         },
//         [TYPES.SET_INTEGRATIONS_LIST](state: IState, { account, data }: { account: string; data: any[] }) {
//             !state.integrationsList[account] && (state.integrationsList[account] = {});
//             for (const integration of data) state.integrationsList[account][integration.id] = integration;
//         },
//     },

//     actions: {
//         setDataFor({ commit, getters }: { commit: any; getters: any }, value: { type: string; account: string; data: any }) {
//             switch (value.type) {
//                 case Type.tokens:
//                     commit(TYPES.SET_ASSETS_LIST, value);
//                     break;
//                 case Type.nfts:
//                     commit(TYPES.SET_NFTS_LIST, value);
//                     break;
//                 case Type.integrations:
//                     commit(TYPES.SET_INTEGRATIONS_LIST, value);
//                     break;
//             }
//         },

//         async loadFromCache(
//             { dispatch, state, commit }: { dispatch: any; state: IState; commit: any },
//             { account, type }: { account: string; type: string },
//         ) {
//             try {
//                 const [balances, totalBalances] = await Promise.all([
//                     await balancesDB.getBalancesByAccount(type, account),
//                     await balancesDB.getTotalBalance(account),
//                 ]);

//                 if (!balances) return;

//                 dispatch('setDataFor', { type, account, data: balances });
//             } catch (error) {
//                 console.error('loadFromCache', error);
//             }
//         },
//     },
// };
