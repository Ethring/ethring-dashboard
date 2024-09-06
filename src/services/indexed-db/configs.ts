import { values, orderBy } from 'lodash';

import Dexie from 'dexie';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';
import { Ecosystems } from '@/shared/models/enums/ecosystems.enum';
import { formatRecord } from '@/shared/tokens-format/base-format';

class ConfigsDB extends Dexie {
    networks: Dexie.Table<any, string>;
    tokens: Dexie.Table<any, string>;

    cosmologyNetworks: Dexie.Table<any, string>;
    cosmologyAssets: Dexie.Table<any, string>;

    constructor(version: number = 1) {
        super(DB_TABLES.CONFIGS_V2);

        this.version(version).stores({
            [DB_TABLES.NETWORKS]: 'id, ecosystem, chain',
            [DB_TABLES.COSMOLOGY_NETWORKS]: 'id, ecosystem, chain',

            [DB_TABLES.TOKENS]: 'id, ecosystem, chain, [chain+address], address',
            [DB_TABLES.COSMOLOGY_TOKENS]: 'chain_name',
        });

        this.networks = this.table(DB_TABLES.NETWORKS);
        this.tokens = this.table(DB_TABLES.TOKENS);

        this.cosmologyNetworks = this.table(DB_TABLES.COSMOLOGY_NETWORKS);
        this.cosmologyAssets = this.table(DB_TABLES.COSMOLOGY_TOKENS);
    }

    async saveNetworksConfig(store: string, networks: any[], ecosystem: Ecosystems, lastUpdated: string | null) {
        const table = store === DB_TABLES.COSMOLOGY_NETWORKS ? this.cosmologyNetworks : this.networks;

        const updatedDate = Number(new Date());
        const dateToSave = lastUpdated ? new Date(lastUpdated) : updatedDate;

        for (const chain in networks) {
            networks[chain].id = `${ecosystem}:${chain}`;
            networks[chain].ecosystem = ecosystem?.toUpperCase() || '';
            networks[chain].chain = chain;
            networks[chain].updated_at = Number(dateToSave);
        }

        try {
            await this.transaction('rw', table, async () => {
                await table.bulkPut(values(networks));
                logger.debug(`All ${ecosystem} networks saved`);
            });
        } catch (error) {
            logger.error(`[IndexedDB](saveNetworksConfig): ${store}`, error);
        }
    }

    async saveTokensConfig(tokens: any[], ecosystem: Ecosystems, network: string, lastUpdated: string | null) {
        const dateToSave = lastUpdated ? new Date(lastUpdated) : new Date();

        const formatTokensObj = (tokens: any[]) => {
            for (const tokenContract in tokens) {
                formatRecord(ecosystem, network, tokens[tokenContract]);
                tokens[tokenContract].updated_at = Number(dateToSave);
            }
            return tokens;
        };

        const formattedTokensObject = formatTokensObj(tokens);

        try {
            await this.transaction('rw', this.tokens, async () => {
                await this.tokens.bulkPut(values(formattedTokensObject));
                logger.debug(`[tokens] All tokens for network: ${ecosystem} - ${network} saved`);
            });

            return formattedTokensObject;
        } catch (error) {
            logger.error(`[IndexedDB](saveTokensConfig): ${DB_TABLES.TOKENS}`, error);
        }
    }

    async saveCosmologyAssets(configs: any[], lastUpdated: string | null) {
        try {
            const dateToSave = lastUpdated ? new Date(lastUpdated) : new Date();

            for (const config of configs) config.updated_at = Number(dateToSave);

            await this.transaction('rw', this.cosmologyAssets, async () => {
                await this.cosmologyAssets.bulkPut(configs);
                logger.debug(`All cosmology tokens saved`);
            });
        } catch (error) {
            logger.error(`[IndexedDB](saveCosmologyAssets):`, error);
        }
    }

    async getAllNetworksByEcosystem(ecosystem: Ecosystems) {
        try {
            return await this.networks.where('ecosystem').equals(ecosystem).toArray();
        } catch (error) {
            logger.error(`[IndexedDB](getAllNetworksByEcosystem):`, error);
            return [];
        }
    }

    async getAllNetworksByEcosystemHash(ecosystem: Ecosystems, isCosmology: boolean = false): Promise<Record<string, any>> {
        if (isCosmology) return await this.getAllCosmologyNetworks();

        try {
            const networks = await this.networks.where('ecosystem').equals(ecosystem).toArray();
            const networksHash = networks.reduce((acc, network) => {
                acc[network.chain] = network;
                return acc;
            }, {});
            return networksHash;
        } catch (error) {
            logger.error(`[IndexedDB](getAllNetworksByEcosystem):`, error);
            return {};
        }
    }

    async getAllCosmologyNetworks(): Promise<Record<string, any>> {
        try {
            const networks = await this.cosmologyNetworks.toArray();
            const networksHash = networks.reduce((acc, network) => {
                acc[network.chain] = network;
                return acc;
            }, {});
            return networksHash;
        } catch (error) {
            logger.error(`[IndexedDB](getAllCosmologyNetworks):`, error);
            return {};
        }
    }

    async getAllTokensByChainHash(chain: string): Promise<Record<string, any>> {
        try {
            const tokens = await this.tokens.where('chain').equals(chain).toArray();
            const tokensHash = tokens.reduce((acc, token) => {
                acc[token.id] = token;
                return acc;
            }, {});
            return tokensHash;
        } catch (error) {
            logger.error(`[IndexedDB](getAllTokensByChainHash):`, error);
            return {};
        }
    }

    async getAllTokensByChain(chain: string) {
        try {
            const tokens = await this.tokens.where({ chain }).toArray();
            return orderBy(tokens, ['name', 'verified'], ['asc', 'desc']);
        } catch (error) {
            logger.error(`[IndexedDB](getAllTokensByNetwork):`, error);
            return [];
        }
    }

    async getAllCosmologyTokens() {
        try {
            return await this.cosmologyAssets.toArray();
        } catch (error) {
            logger.error(`[IndexedDB](getAllCosmologyTokens):`, error);
            return [];
        }
    }

    async clearTable(store: string) {
        try {
            this.table(store).clear();
        } catch (error) {
            logger.error(`[IndexedDB](clearTable): ${store}`, error);
        }
    }

    async bulkDeleteByKeys(store: string, key: string, value?: string) {
        try {
            await this.transaction('rw', this.table(store), async () => {
                if (!value) return await this.table(store).clear();
                await this.table(store).where(key).equals(value).delete();
            });
        } catch (error) {
            logger.error(`[IndexedDB](bulkDeleteByKeys): ${store}`, error);
        }
    }

    async getTokenByChainAndAddress(chain: string, address: string) {
        try {
            return await this.tokens.where({ chain, address }).first();
        } catch (error) {
            logger.error(`[IndexedDB](getTokenByAddress):`, error);
            return null;
        }
    }

    async getTokenByAddress(address: string) {
        try {
            return await this.tokens.where({ address }).first();
        } catch (error) {
            logger.error(`[IndexedDB](getTokenByAddress):`, error);
            return null;
        }
    }
}

export default ConfigsDB;
