import Dexie from 'dexie';
import BigNumber from 'bignumber.js';
import { orderBy } from 'lodash';

import { IntegrationBalance, AssetBalance, NftBalance, BalanceType } from '@/core/balance-provider/models/types';
import { IntegrationBalanceType, Type } from '@/core/balance-provider/models/enums';

import { filterSmallBalances, getIntegrationsBalance, getTotalBalance, getTotalBalanceByType } from '@/core/balance-provider/calculation';

import { DB_TABLES } from '@/shared/constants/indexedDb';

import logger from '@/shared/logger';
import { IAsset } from '@/shared/models/fields/module-fields';

class BalancesDB extends Dexie {
    balances: Dexie.Table<any, string>;

    constructor(version: number = 1) {
        super(DB_TABLES.BALANCES_V2);

        this.version(version).stores({
            [DB_TABLES.BALANCES]:
                'uniqueId, id, [account+chain+accountAddress+dataType], [account+chain+accountAddress], [account+chain+dataType], [account+chain], [account+dataType], [account+dataType+id]',
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
     *         }} {
     *             dataType,
     *             account,
     *             address,
     *             chain,
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
        }: {
            dataType: BalanceType;
            account: string;
            address: string;
            chain: string;
        },
    ) {
        const accountLower = account.toLowerCase();
        const addressLower = address.toLowerCase();

        if (Array.isArray(data) && data.length)
            data.forEach((item: any) => {
                item.account = accountLower;
                item.chain = chain;
                item.accountAddress = addressLower;
                item.dataType = dataType;
                item.uniqueId = `${accountLower}__${addressLower}__${item.id}`;
            });

        try {
            await this.transaction('rw', this.balances, async () => {
                await this.balances.bulkPut(data);
            });
        } catch (error) {
            logger.error('saveBalancesByTypes', error);
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
            logger.error(error);
            return [];
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
            logger.error(error);
            return {};
        }
    }

    async getAssetsForAccount(
        account: string,
        minBalance: number,
        assetIndex: number,
    ): Promise<{
        list: any[];
        total: number;
        totalBalance: string;
    }> {
        try {
            const accountLower = account.toLowerCase();

            const response = await this.balances.where({ account: accountLower, dataType: Type.tokens }).toArray();

            const filteredBalances = response.filter((elem: any) => filterSmallBalances(elem, minBalance));

            const totalBalance = getTotalBalance(filteredBalances as AssetBalance[]);

            return {
                list: orderBy(filteredBalances, (balance) => +balance.balanceUsd || 0, ['desc']).slice(0, assetIndex),
                total: filteredBalances.length,
                totalBalance: totalBalance.toFixed(6),
            };
        } catch (error) {
            logger.error('getAssetsForAccount', error);

            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
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
            logger.error('updateTokenImage', error);
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
        try {
            const accountLower = account.toLowerCase();

            const response = await this.balances.where({ account: accountLower, dataType: Type.integrations }).toArray();

            const byPlatforms = response.reduce((grouped: Map<string, any>, integration: IntegrationBalance) => {
                const { platform, type, balances = [], logo = null, healthRate = null, leverageRate } = integration;

                const filteredBalances = balances.filter((elem: any) => filterSmallBalances(elem, minBalance));

                if (!filteredBalances.length) return grouped;

                if (!grouped.has(platform))
                    grouped.set(platform, {
                        data: [],
                        platform,
                        healthRate: healthRate || null,
                        logoURI: logo || null,
                        totalGroupBalance: 0,
                        totalRewardsBalance: 0,
                    });

                const platformData = grouped.get(platform);

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
            }, new Map());

            const list = [...byPlatforms.values()];

            const totalGroupBalance = list.reduce((acc: BigNumber, item: any) => acc.plus(item.totalGroupBalance), new BigNumber(0));

            return {
                list: orderBy(list, (platform) => +platform.totalGroupBalance || 0, ['desc']),
                total: list.length,
                totalBalance: totalGroupBalance.toString(),
            };
        } catch (error) {
            logger.error('getProtocolsByPlatforms', error);
            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
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

        try {
            const accountLower = account.toLowerCase();
            const response = await this.balances.where({ account: accountLower, dataType: Type.nfts }).toArray();

            const collections = response.reduce((grouped: Map<string, any>, nft: NftBalance) => {
                const { collection, token, chainLogo } = nft || {};

                const { address } = collection || {};

                if (!grouped.has(address))
                    grouped.set(address, {
                        ...collection,
                        chainLogo,
                        token,
                        nfts: [],
                        floorPriceUsd: BigNumber(0),
                        totalGroupBalance: BigNumber(0),
                    });

                const collectionData = grouped.get(address);

                collectionData.totalGroupBalance = BigNumber(nft.price || 0)
                    .multipliedBy(token.price || 0)
                    .toString();

                collectionData.floorPriceUsd = BigNumber(collection.floorPrice || 0)
                    .multipliedBy(token.price || 0)
                    .toString();

                if (BigNumber(collectionData.floorPriceUsd).isGreaterThanOrEqualTo(minBalance)) collectionData.nfts.push(nft);

                if (!collectionData.nfts.length) grouped.delete(address);

                return grouped;
            }, new Map());

            const nftList = [...collections.values()];

            const totalGroupBalance = nftList.reduce((acc: BigNumber, item: any) => acc.plus(item.totalGroupBalance), new BigNumber(0));

            return {
                list: orderBy(nftList, (nft) => +nft.totalGroupBalance || 0, ['desc']).slice(0, nftIndex),
                total: nftList.length,
                totalBalance: totalGroupBalance.toString(),
            };
        } catch (error) {
            logger.error('getNftsByCollections', error);
            return {
                list: [],
                total: 0,
                totalBalance: '0',
            };
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
            logger.error('getTotalBalance', error);
            return {
                total: '0',
                assetsBalance: '0',
                integrationsBalance: '0',
            };
        }
    }
}

export default BalancesDB;
