import { values } from 'lodash';

import Dexie from 'dexie';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';

import { formatRecord } from '@/shared/tokens-format/base-format';

class IndexedDBService {
    defaultStores = {
        [DB_TABLES.BALANCES]: 'id, [account+chain+address+type]',
    };

    configStores = {
        [DB_TABLES.NETWORKS]: 'id, ecosystem, chain',
        [DB_TABLES.COSMOLOGY_NETWORKS]: 'id, ecosystem, chain',

        [DB_TABLES.TOKENS]: 'id, ecosystem, chain',
        [DB_TABLES.COSMOLOGY_TOKENS]: 'chain_name',
    };

    constructor(dbName = 'balances', version = 1) {
        this.db = new Dexie(dbName);

        const stores = dbName === 'configs' ? this.configStores : this.defaultStores;

        this.db.version(version).stores(stores);

        if (!this.db.isOpen()) this.db.open();

        if (process.env.NODE_ENV === 'development') {
            !window.db && (window.db = {});
            window.db[dbName] = this.db;
        }

        this.db.on('blocked', () => {
            logger.warn('Database is blocked');
        });

        this.db.on('populate', () => {
            logger.debug('Database is populated');
        });
    }

    async clearTable(tableName) {
        if (!this.db[tableName]) return;
        await this.db.table(tableName).clear();
    }

    async bulkDeleteByKeys(tableName, key, value) {
        if (!this.db[tableName]) return;
        await this.db.transaction('rw', this.db[tableName], async () => {
            await this.db[tableName].where(key).equals(value).delete();
        });
    }

    // ==============================================================
    // ======================= SETTERS ==============================
    // ==============================================================

    async saveData(key, value) {
        if (!key) return;

        try {
            const existingRecord = await this.db.data.where('key').equals(key).first();

            const parsedVal = JSON.parse(JSON.stringify(value));

            if (!existingRecord) return await this.db.data.put({ key, value: parsedVal });

            return await this.db.data.update(existingRecord.id, { key, value: parsedVal });
        } catch (error) {
            logger.warn(`[IndexedDB](saveData): ${key}`, error);
        }
    }

    // ==========================================================================
    // ======================= SETTERS FOR BALANCES ==============================
    // ==========================================================================

    async saveBalancesByTypes(store, balances, { chain, type, account, address } = {}) {
        try {
            const balancesList = [
                {
                    id: `${account}:${chain}:${address}:${type}`,
                    account,
                    chain,
                    address,
                    type,
                    value: JSON.stringify(balances),
                },
            ];

            await this.db.transaction('rw', this.db[store], async () => {
                await this.db[store].bulkPut(balancesList);
            });
        } catch (error) {
            logger.error(`[IndexedDB](saveBalancesByTypes): ${store}`, error);
        }
    }

    // ==========================================================================
    // ======================= SETTERS FOR CONFIGS ==============================
    // ==========================================================================

    async saveNetworksObj(store, networks, { ecosystem, lastUpdated } = {}) {
        const updatedDate = Number(new Date());
        const lastUpdatedDate = new Date(lastUpdated);
        const dateToSave = lastUpdatedDate > new Date(0) ? lastUpdatedDate : updatedDate;

        for (const chain in networks) {
            networks[chain].id = `${ecosystem}:${chain}`;
            networks[chain].ecosystem = ecosystem?.toUpperCase() || '';
            networks[chain].chain = chain;
            networks[chain].updated_at = Number(dateToSave);
            networks[chain].value = JSON.stringify(networks[chain]);
        }

        try {
            await this.db.transaction('rw', this.db[store], async () => {
                await this.db[store].bulkPut(values(networks));
                logger.debug(`All ${ecosystem} networks saved`);
            });
        } catch (error) {
            logger.error(`[IndexedDB](saveNetworksObj): ${store}`, error);
        }
    }

    async saveCosmologyAssets(store, configs, { lastUpdated } = {}) {
        try {
            const updatedDate = Number(new Date());
            const lastUpdatedDate = new Date(lastUpdated);
            const dateToSave = lastUpdatedDate > new Date(0) ? lastUpdatedDate : updatedDate;

            for (const config of configs) {
                config.updated_at = Number(dateToSave);
                config.value = JSON.stringify(config);
            }

            await this.db.transaction('rw', this.db[store], async () => {
                await this.db[store].bulkPut(configs);
                logger.debug(`All cosmology tokens saved`);
            });
        } catch (error) {
            logger.error(`[IndexedDB](saveCosmologyAssets): ${store}`, error);
        }
    }

    async saveTokensObj(store, tokens, { network, ecosystem, lastUpdated } = {}) {
        const formatTokensObj = (tokens) => {
            const updatedDate = Number(new Date());
            const lastUpdatedDate = new Date(lastUpdated);
            const dateToSave = lastUpdatedDate > new Date(0) ? lastUpdatedDate : updatedDate;

            for (const tokenContract in tokens) {
                formatRecord(ecosystem, network, tokens[tokenContract]);
                tokens[tokenContract].updated_at = Number(dateToSave);
                tokens[tokenContract].value = JSON.stringify(tokens[tokenContract]);
            }
            return tokens;
        };

        const formattedTokensObject = formatTokensObj(tokens);

        await this.db.transaction('rw', this.db[store], async () => {
            await this.db[store].bulkPut(values(formattedTokensObject));
            logger.debug(`[tokens] All tokens for network: ${ecosystem} - ${network} saved`);
        });

        return formattedTokensObject;
    }

    // ==============================================================
    // ======================= GETTERS ==============================
    // ==============================================================

    async getAllListFrom(store) {
        try {
            const response = await this.db[store].toArray();
            return response.map((item) => (item?.value ? JSON.parse(item.value) : item));
        } catch (error) {
            logger.warn(`[IndexedDB](getAllListFrom): ${store}`, error);
            return [];
        }
    }

    async getAllObjectFrom(store, key = 'id', value = '', { index = 'id', isArray = false } = {}) {
        if (!this.db[store]) return null;

        try {
            const request = value ? this.db[store].where(key).equals(value).toArray() : this.db[store].toArray();

            const response = await request;

            if (isArray) return response.map((record) => (record?.value ? JSON.parse(record.value) : record));

            const responseObj = {};

            for (const item of response) responseObj[item[index]] = item?.value ? JSON.parse(item.value) : item;

            return responseObj;
        } catch (error) {
            logger.warn(`[IndexedDB](getAllObjectFrom): ${store}`, error);
            return [];
        }
    }

    async getDataFrom(store, key) {
        if (!key) return null;

        if (!this.db[store]) return null;

        try {
            const response = await this.db[store].where('id').equals(key).first();

            if (!response) return null;

            return JSON.parse(response.value);
        } catch (error) {
            logger.warn(`[IndexedDB](getDataFrom): ${store}`, error);
            return null;
        }
    }

    async getData(key) {
        if (!key) return null;

        try {
            const result = await this.db.data.where('key').equals(key).first();
            return result ? result.value : null;
        } catch (error) {
            logger.warn(`[IndexedDB](getData): ${key}`, error);
            return null;
        }
    }

    // ==========================================================================
    // ======================= GETTER FOR BALANCES ==============================
    // ==========================================================================
    async getBalancesByType(store, { account, chain, address, type } = {}) {
        if (!this.db[store]) return null;

        try {
            const response = await this.db[store]
                .where({
                    account,
                    chain,
                    address,
                    type,
                })
                .toArray();

            const [result] = response || [];

            if (!result) return null;

            return JSON.parse(result.value);
        } catch (error) {
            logger.warn(`[IndexedDB](getBalancesByType): ${store}`, error);
            return [];
        }
    }

    // ==============================================================
}

export default IndexedDBService;
