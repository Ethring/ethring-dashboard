import Dexie from 'dexie';
import logger from '../../logger';
import { ECOSYSTEMS } from '../../Adapter/config';
import _ from 'lodash';

class IndexedDBService {
    defaultStores = {
        data: '++id, key',
    };

    configStores = {
        tokens: 'id, ecosystem, chain',
        networks: 'id, ecosystem, chain',
        cosmology: 'id, ecosystem, chain',
        cosmologyTokens: 'chain_name',
    };

    constructor(dbName = 'balances', version = 1) {
        logger.info('IndexedDBService', dbName);

        this.db = new Dexie(dbName);

        const stores = dbName === 'configs' ? this.configStores : this.defaultStores;

        this.db.version(version).stores(stores);

        if (!this.db.isOpen()) {
            this.db.open();
        }

        if (process.env.NODE_ENV === 'development') {
            window.db = {};
            window.db[dbName] = this.db;
        }

        this.db.on('blocked', () => {
            logger.warn('Database is blocked');
        });

        this.db.on('populate', () => {
            logger.info('Database is populated');
        });

        this.db.on('ready', () => {
            logger.info('Database is ready');
        });
    }

    // ==============================================================
    // ======================= SETTERS ==============================
    // ==============================================================

    async saveData(key, value) {
        if (!key) {
            return;
        }

        try {
            const existingRecord = await this.db.data.where('key').equals(key).first();

            const parsedVal = JSON.parse(JSON.stringify(value));

            if (!existingRecord) {
                return await this.db.data.put({ key, value: parsedVal });
            }

            return await this.db.data.update(existingRecord.id, { key, value: parsedVal });
        } catch (error) {
            logger.warn(`[IndexedDB](saveData): ${key}`, error);
        }
    }

    // ==========================================================================
    // ======================= SETTERS FOR CONFIGS ==============================
    // ==========================================================================

    async saveNetworksObj(store, networks, { ecosystem, cosmology = false } = {}) {
        await this.db.transaction('rw', this.db[store], async () => {
            for (const chain in networks) {
                networks[chain].ecosystem = ecosystem?.toUpperCase() || '';

                await this.db[store].put({
                    id: chain,
                    ecosystem: networks[chain].ecosystem,
                    chain,
                    value: JSON.stringify(networks[chain]),
                });
            }

            logger.debug(`All ${ecosystem} networks saved`);
        });
    }

    async saveCosmologyAssets(store, configs) {
        await this.db.transaction('rw', this.db[store], async () => {
            await this.db[store].bulkPut(configs);
            logger.debug(`All cosmology tokens saved`);
        });
    }

    async saveTokensObj(store, tokens, { network, ecosystem, scheme } = {}) {
        const formatTokensObj = (tokens) => {
            for (const tokenContract in tokens) {
                tokens[tokenContract].id = `${network}:asset__${tokenContract}:${tokens[tokenContract].symbol}`;
                tokens[tokenContract].chain = network;
                tokens[tokenContract].ecosystem = ecosystem?.toUpperCase() || '';
                tokens[tokenContract].balance = 0;
                tokens[tokenContract].balanceUsd = 0;

                tokens[tokenContract].value = JSON.stringify(tokens[tokenContract]);
            }
            return tokens;
        };

        const formatTokensArr = (tokens) => {
            for (const token of tokens) {
                const contract = token?.address || token?.base;
                token.id = `${network}:asset__${contract}:${token.symbol}`;
                token.chain = network;
                token.ecosystem = ecosystem?.toUpperCase() || '';
                token.balance = 0;
                token.balanceUsd = 0;

                token.value = JSON.stringify(token);
            }

            return tokens;
        };

        const getFormattedTokens = (tokens) => {
            if (Array.isArray(tokens)) {
                return formatTokensArr(tokens);
            }

            const formatted = formatTokensObj(tokens);

            return _.values(formatted).map((token) => ({ ...token, value: JSON.stringify(token) }));
        };

        const formattedTokens = getFormattedTokens(tokens);

        await this.db.transaction('rw', this.db[store], async () => {
            await this.db[store].bulkPut(formattedTokens);
            logger.debug(`[tokens] All tokens for network: ${ecosystem} - ${network} saved`);
        });
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

    async getAllObjectFrom(store, key = 'id', value = null, { index = 'id' } = {}) {
        if (!this.db[store]) {
            return null;
        }

        const request = value ? this.db[store].where(key).equals(value).toArray() : this.db[store].toArray();

        try {
            const response = await request;
            const responseObj = {};

            for (const item of response) {
                responseObj[item[index]] = JSON.parse(item.value);
            }

            return responseObj;
        } catch (error) {
            logger.warn(`[IndexedDB](getAllObjectFrom): ${store}`, error);
            return [];
        }
    }

    async getDataFrom(store, key) {
        if (!key) {
            return null;
        }

        if (!this.db[store]) {
            return null;
        }

        try {
            const response = await this.db[store].where('id').equals(key).first();

            if (!response) {
                return null;
            }

            return JSON.parse(response.value);
        } catch (error) {
            logger.warn(`[IndexedDB](getDataFrom): ${store}`, error);
            return null;
        }
    }

    async getData(key) {
        if (!key) {
            return null;
        }

        try {
            const result = await this.db.data.where('key').equals(key).first();
            return result ? result.value : null;
        } catch (error) {
            logger.warn(`[IndexedDB](getData): ${key}`, error);
            return null;
        }
    }
}

export default IndexedDBService;
