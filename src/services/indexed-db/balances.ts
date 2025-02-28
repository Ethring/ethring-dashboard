import Dexie from 'dexie';
import BigNumber from 'bignumber.js';
import { difference, orderBy } from 'lodash';

import { IntegrationBalance, AssetBalance, NftBalance, BalanceType } from '@/core/balance-provider/models/types';
import { IntegrationBalanceType, Type } from '@/core/balance-provider/models/enums';

import { filterSmallBalances, getIntegrationsBalance, getTotalBalance, getTotalBalanceByType } from '@/core/balance-provider/calculation';

import { DB_TABLES } from '@/shared/constants/indexedDb';

import { IAsset } from '@/shared/models/fields/module-fields';

class BalancesDB extends Dexie {
    balances: Dexie.Table<any, string>;

    constructor(version: number = 1) {
        super(DB_TABLES.BALANCES_V2);

        this.version(version).stores({
            [DB_TABLES.BALANCES]:
                'uniqueId, id, [account+chain+accountAddress+dataType], [account+chain+accountAddress], [account+chain+dataType], [account+chain+dataType+provider], [account+chain], [account+dataType], [account+dataType+id], [account+dataType+collection.address]',
        });

        this.balances = this.table(DB_TABLES.BALANCES);
    }

    /**
     * Save balances by types
     *
     * @param {*} data
     * @param {{
     *             dataType: BalanceType;
     *             account: string;
     *             address: string;
     *             chain: string;
     *             provider: string;
     *         }} {
     *             dataType,
     *             account,
     *             address,
     *             chain,
     *             provider,
     *         }
     * @memberof BalancesDB
     */
    async saveBalancesByTypes(
        data: any,
        {
            dataType,
            account,
            address,
            chain,
            provider,
        }: {
            dataType: BalanceType;
            account: string;
            address: string;
            chain: string;
            provider: string;
        },
    ) {
        const accountLower = account.toLowerCase();
        const addressLower = address.toLowerCase();
        const dateTime = new Date();

        if (Array.isArray(data) && data.length)
            data.forEach((item: any) => {
                item.account = accountLower;
                item.chain = chain;
                item.accountAddress = addressLower;
                item.dataType = dataType;
                item.uniqueId = `${accountLower}__${addressLower}__${item.id}`;
                item.updatedAt = Number(dateTime);
                item.provider = provider;
            });

        const balances = await this.balances.where({ account: accountLower, chain, dataType }).toArray();

        const diff = difference(
            balances.map((item) => item.uniqueId),
            data.map((item: any) => item.uniqueId),
        );

        try {
            // ! If balances are different, delete old balances before saving new ones
            if (diff.length)
                await this.transaction('rw', this.balances, async () => {
                    await this.balances.bulkDelete(diff);
                });

            await this.transaction('rw', this.balances, async () => {
                await this.balances.bulkPut(data);
            });
        } catch (error) {
            console.error('saveBalancesByTypes', error);
        }
    }

    /**
     * Get balances by account and type
     *
     * @param {string} dataType Type of data (tokens, integrations, nfts)
     * @param {string} account Account address to get balances
     * @returns {Promise<IAsset[]>} Balances list
     * @memberof BalancesDB
     */
    async getBalancesByAccountAndType(dataType: string, account: string): Promise<IAsset[] | IntegrationBalance[] | NftBalance[]> {
        try {
            return await this.balances.where({ account, dataType }).toArray();
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    /**
     * Get balances by account
     *
     * @param {string} dataType Type of data (tokens, integrations, nfts)
     * @param {string} account Account address to get balances
     *
     * @returns {Promise<IAsset[]>} Balances
     * @memberof BalancesDB
     */
    async getBalancesByAccount(dataType: string, account: string): Promise<IAsset[]> {
        try {
            const accountLower = account.toLowerCase();
            return await this.balances.where({ account: accountLower, dataType }).toArray();
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    /**
     * Get balance for provider
     *
     * @param {string} provider Provider name
     * @param {string} dataType Type of data (tokens, integrations, nfts)
     * @param {string} account Account address to get balances
     * @param {string} chain Chain name
     *
     * @returns {Promise<IAsset | null>} Balances
     * @memberof BalancesDB
     */
    async getBalanceForProvider(provider: string, dataType: string, account: string, chain: string): Promise<IAsset | null> {
        try {
            const accountLower = account.toLowerCase();
            return await this.balances.where({ account: accountLower, dataType, chain, provider }).first();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    /**
     * Get balances by account and type with chains
     *
     * @param {string} dataType Type of data (tokens, integrations, nfts)
     * @param {string} account Account address to get balances
     *
     * @returns {Promise<{ [chain: string]: IAsset[] }>} Balances grouped by chains
     * @memberof BalancesDB
     */
    async getBalancesByAccountAndTypeWithChains(
        dataType: string,
        account: string,
    ): Promise<{
        [chain: string]: IAsset[];
    }> {
        try {
            const accountLower = account.toLowerCase();

            const response = await this.balances.where({ account: accountLower, dataType }).toArray();

            // Group balances by chains
            const balancesByChains = response.reduce((acc: any, item: any) => {
                if (!acc[item.chain]) acc[item.chain] = [];
                acc[item.chain].push(item);
                return acc;
            }, {});

            return balancesByChains;
        } catch (error) {
            console.error(error);
            return {};
        }
    }

    async getAssetsForAccount(
        account: string,
        minBalance: number,
        { assetIndex = 0, isAll = false }: { assetIndex?: number; isAll?: boolean },
    ): Promise<{
        list: any[];
        total: number;
        totalBalance: string;
    }> {
        const accountLower = account.toLowerCase();

        let assetsList = null;
        const list = [];
        let totalBalance = BigNumber(0);

        try {
            assetsList = await this.balances.where({ account: accountLower, dataType: Type.tokens }).toArray();

            for (const asset of assetsList) {
                if (!filterSmallBalances(asset, minBalance)) continue;
                list.push(asset);
                totalBalance = totalBalance.plus(asset.balanceUsd || 0);
            }

            if (isAll)
                return {
                    list: orderBy(list, (asset) => +asset.balanceUsd || 0, ['desc']),
                    total: list.length,
                    totalBalance: totalBalance.toFixed(6),
                };

            return {
                list: orderBy(list, (asset) => +asset.balanceUsd || 0, ['desc']).slice(0, assetIndex),
                total: list.length,
                totalBalance: totalBalance.toFixed(6),
            };
        } catch (error) {
            console.error('getAssetsForAccount', error);

            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
        } finally {
            if (assetsList) assetsList.length = 0;
            if (list) list.length = 0;
            if (totalBalance) totalBalance = BigNumber(0);
        }
    }

    async getBalanceById(account: string, dataType: string, id: string): Promise<object> {
        const accountLower = account.toLowerCase();

        try {
            const asset = (await this.balances.where({ account: accountLower, dataType, id }).first()) || {};

            return asset;
        } catch (error) {
            console.error('getAssetsForAccount', error);

            return {};
        }
    }

    async getPoolsForAccount(
        account: string,
        minBalance: number,
        { assetIndex = 0, isAll = false }: { assetIndex?: number; isAll?: boolean },
    ): Promise<{
        list: any[];
        total: number;
        totalBalance: string;
    }> {
        const accountLower = account.toLowerCase();

        let assetsList = null;
        const list = [];
        let totalBalance = BigNumber(0);

        try {
            assetsList = await this.balances.where({ account: accountLower, dataType: Type.pools }).toArray();

            if (!assetsList || !assetsList.length) return { list: [], total: 0, totalBalance: '0' };

            for (const asset of assetsList) {
                // if (!filterSmallBalances(asset, minBalance)) continue; // TODO: uncomment after adding balanceUsd to pools
                list.push(asset);
                totalBalance = totalBalance.plus(asset.balanceUsd || 0);
            }

            if (isAll)
                return {
                    list: orderBy(list, (asset) => Number(asset.balanceUsd) || 0, ['desc']),
                    total: list.length,
                    totalBalance: totalBalance.toFixed(6),
                };

            return {
                list: orderBy(list, (asset) => Number(asset.balanceUsd) || 0, ['desc']).slice(0, assetIndex),
                total: list.length,
                totalBalance: totalBalance.toFixed(6),
            };
        } catch (error) {
            console.error('getAssetsForAccount', error);

            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
        } finally {
            if (assetsList) assetsList.length = 0;
            if (list) list.length = 0;
            if (totalBalance) totalBalance = BigNumber(0);
        }
    }

    /**
     * Update token image for account
     *
     * @param {string} account Account address to get balances
     * @param {string} id Token id
     * @param {string} image Token image
     *
     * @memberof BalancesDB
     */
    async updateTokenImage(account: string, id: string, image: string) {
        try {
            await this.balances.where({ account, dataType: Type.tokens, id }).modify({ logo: image });
        } catch (error) {
            console.error('updateTokenImage', error);
        }
    }

    /**
     * Get Protocols balances by platforms (integrations) for account
     *
     * @param {string} account Account address to get balances
     * @returns {{
     *            list: any[];
     *            total: number;
     *            totalBalance: string;
     *           }} Balances list grouped by platforms with total balance and total count of platforms
     * @memberof BalancesDB
     */
    async getProtocolsByPlatforms(
        account: string,
        minBalance: number = 0,
    ): Promise<{
        list: any[];
        total: number;
        totalBalance: string;
    }> {
        const accountLower = account.toLowerCase();

        let integrations = null;
        const byPlatforms: Record<string, any> = {};
        let totalBalance = BigNumber(0);

        try {
            integrations = await this.balances.where({ account: accountLower, dataType: Type.integrations }).toArray();

            for (const integration of integrations) {
                const { platform, balances = [], logo = null, healthRate = null, leverageRate } = integration;

                const filteredBalances = balances.filter((elem: any) => filterSmallBalances(elem, minBalance));

                if (!filteredBalances.length) continue;

                if (!byPlatforms[integration.platform])
                    byPlatforms[integration.platform] = {
                        data: [],
                        platform,
                        healthRate: healthRate || null,
                        logoURI: logo || null,
                        totalGroupBalance: 0,
                        totalRewardsBalance: 0,
                    };

                byPlatforms[integration.platform].data.push({ ...integration, balances: filteredBalances });
                byPlatforms[integration.platform].healthRate = healthRate || null;
                byPlatforms[integration.platform].logoURI = logo || null;

                for (const balance of filteredBalances) balance.leverageRate = leverageRate || null;

                byPlatforms[integration.platform].totalGroupBalance = BigNumber(byPlatforms[integration.platform].totalGroupBalance)
                    .plus(getTotalBalanceByType(filteredBalances as AssetBalance[], integration.type as IntegrationBalanceType))
                    .toString();

                byPlatforms[integration.platform].totalRewardsBalance = BigNumber(byPlatforms[integration.platform].totalRewardsBalance)
                    .plus(getTotalBalanceByType(filteredBalances as AssetBalance[], IntegrationBalanceType.PENDING))
                    .toString();

                totalBalance = totalBalance.plus(byPlatforms[integration.platform].totalGroupBalance);
            }

            return {
                list: orderBy(Object.values(byPlatforms), (platform) => +platform.totalGroupBalance || 0, ['desc']),
                total: Object.keys(byPlatforms).length,
                totalBalance: totalBalance.toString(),
            };
        } catch (error) {
            console.error('getProtocolsByPlatforms', error);
            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
        } finally {
            if (integrations) integrations.length = 0;
            for (const key in byPlatforms) if (byPlatforms[key]) delete byPlatforms[key];
            if (totalBalance) totalBalance = BigNumber(0);
        }
    }

    /**
     * Get NFTs by collections for account
     *
     * @param {string} account Account address to get balances
     * @param {number} minBalance Minimum balance to filter
     * @param {number} nftIndex Index of NFTs to return
     *
     * @returns {{
     *            list: any[];
     *            total: number;
     *            totalBalance: string;
     *           }} NFTs list grouped by collections with total balance and total count of NFTs collections
     * @memberof BalancesDB
     */
    async getNftsByCollections(
        account: string,
        minBalance: number = 0,
        nftIndex: number,
    ): Promise<{
        list: any[];
        total: number;
        totalBalance?: string;
    }> {
        if (!account) return { list: [], total: 0, totalBalance: '0' };

        const accountLower = account.toLowerCase();

        let nfts = null;
        const collections: Record<string, any> = {};
        let totalBalance = BigNumber(0);

        try {
            nfts = await this.balances.where({ account: accountLower, dataType: Type.nfts }).toArray();

            for (const nft of nfts) {
                const { collection, token, chainLogo } = nft || {};

                const { address } = collection || {};

                if (!collections[address])
                    collections[address] = {
                        ...collection,
                        chainLogo,
                        token,
                        nfts: 0,
                        floorPriceUsd: BigNumber(0),
                        totalGroupBalance: BigNumber(0),
                    };

                collections[address].totalGroupBalance = BigNumber(nft.price || 0)
                    .multipliedBy(token.price || 0)
                    .toString();

                collections[address].floorPriceUsd = BigNumber(collection.floorPrice || 0)
                    .multipliedBy(token.price || 0)
                    .toString();

                if (BigNumber(collections[address].floorPriceUsd).isGreaterThanOrEqualTo(minBalance)) collections[address].nfts += 1;
                else collections[address].nfts = collections[address].nfts !== 0 ? collections[address].nfts - 1 : 0;

                totalBalance = totalBalance.plus(collections[address].totalGroupBalance);

                if (!collections[address].nfts) delete collections[address];
            }

            return {
                list: orderBy(Object.values(collections), (collection) => +collection.totalGroupBalance || 0, ['desc']).slice(0, nftIndex),
                total: Object.keys(collections).length,
                totalBalance: totalBalance.toString(),
            };
        } catch (error) {
            console.error('getNftsByCollections', error);
            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
        } finally {
            if (nfts) nfts.length = 0;
            for (const key in collections) if (collections[key]) delete collections[key];
            if (totalBalance) totalBalance = BigNumber(0);
        }
    }

    async getNftInfoByCollection(account: string, collection: string): Promise<any> {
        const accountLower = account.toLowerCase();

        try {
            return await this.balances.where({ account: accountLower, dataType: Type.nfts, 'collection.address': collection }).toArray();
        } catch (error) {
            console.error('getNftInfoByCollection', error);
            return [];
        }
    }

    /**
     * Get Total balance for account
     *
     * @param {string} account Account address to get balances
     *
     * @returns {{
     *            total: string;
     *            totalAssetsBalance: string;
     *            integrationsBalance: string;
     *           }} Total balances for account
     * @memberof BalancesDB
     */
    async getTotalBalance(account: string): Promise<{
        total: string;
        assetsBalance: string;
        integrationsBalance: string;
    }> {
        try {
            const accountLower = account.toLowerCase();

            const [tokens, integrations] = await Promise.all([
                this.getBalancesByAccountAndType(Type.tokens, accountLower),
                this.getBalancesByAccountAndType(Type.integrations, accountLower),
            ]);

            const assetsBalance = getTotalBalance(tokens as AssetBalance[]);
            const integrationsBalance = getIntegrationsBalance(integrations as IntegrationBalance[]);

            return {
                total: BigNumber(assetsBalance).plus(integrationsBalance).toFixed(6),
                assetsBalance: assetsBalance.toFixed(6),
                integrationsBalance: integrationsBalance.toString(),
            };
        } catch (error) {
            console.error('getTotalBalance', error);
            return {
                total: '0',
                assetsBalance: '0',
                integrationsBalance: '0',
            };
        }
    }
}

const db = new BalancesDB(1.2);

export default db;
