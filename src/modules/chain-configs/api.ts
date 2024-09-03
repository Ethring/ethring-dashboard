import { AxiosResponse, HttpStatusCode } from 'axios';
import ApiClient from '@/shared/axios';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import ConfigsDB from '@/services/indexed-db/configs';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';

const configsDB = new ConfigsDB(1);

const apiClient = new ApiClient({
    baseURL: process.env.CORE_API || '',
});

const axiosInstance = apiClient.getInstance();

const isNeedToUpdate = (list: any, lastUpdated?: string | null) => {
    let token = null;

    if (Array.isArray(list)) token = list[0];
    else if (typeof list === 'object') token = Object.values(list)[0];

    const { updated_at: updatedAt = null } = token || {};

    if (!updatedAt) return true;
    const now = new Date().getTime();
    const timeToCheck = lastUpdated ? Number(new Date(lastUpdated)) : now;

    const isLastUpdateTimeEqual = timeToCheck === updatedAt;
    const isListEmpty = Array.isArray(list) ? !list.length : !Object.keys(list).length;

    if (!isListEmpty && isLastUpdateTimeEqual && updatedAt) return false;

    return true;
};

// * Get the data from indexedDB first if it exists,
// * then check if it needs to be updated,
// * if not return the data

export const getConfigsByEcosystems = async (
    ecosystem = Ecosystem.EVM,
    { isCosmology = false, lastUpdated = null }: { isCosmology?: boolean; lastUpdated?: string | null } = {
        isCosmology: false,
        lastUpdated: null,
    },
) => {
    let query = '';

    if (ecosystem === Ecosystem.COSMOS) query = '/all';
    if (isCosmology) query = '/all?cosmology=true';

    const store = isCosmology ? DB_TABLES.COSMOLOGY_NETWORKS : DB_TABLES.NETWORKS;

    try {
        const configsHash = await configsDB.getAllNetworksByEcosystemHash(ecosystem, isCosmology);
        if (!isNeedToUpdate(configsHash, lastUpdated)) return configsHash;
    } catch (error) {
        logger.error('Error while getting networks from indexedDB', error);
    }

    try {
        // ! Clear the table before saving new data
        await configsDB.bulkDeleteByKeys(store, 'ecosystem', ecosystem);

        const { data, status }: AxiosResponse = await axiosInstance.get(`networks/${ecosystem.toLowerCase()}${query}`);

        if (status !== HttpStatusCode.Ok) return {};

        // * Save the data to indexedDB
        await configsDB.saveNetworksConfig(store, data, ecosystem, lastUpdated);

        // * Return the data
        return data;
    } catch (err) {
        logger.error('Error while getting networks from API', err);
        return {};
    }
};

export const getCosmologyTokensConfig = async ({ lastUpdated } = { lastUpdated: null }) => {
    const store = DB_TABLES.COSMOLOGY_TOKENS;

    try {
        const tokensList = await configsDB.getAllCosmologyTokens();
        if (!isNeedToUpdate(tokensList, lastUpdated)) return tokensList;
    } catch (error) {
        logger.error('Error while getting cosmology tokens from indexedDB', error);
    }

    try {
        await configsDB.bulkDeleteByKeys(store, 'chain', 'cosmology');

        const { data }: AxiosResponse = await axiosInstance.get(`networks/cosmos/all/tokens`);

        await configsDB.saveCosmologyAssets(data, lastUpdated);

        return data;
    } catch (err) {
        logger.error('Error while getting cosmology tokens from API', err);
        return {};
    }
};

export const getTokensConfigByChain = async (chain: string, ecosystem: string, { lastUpdated } = { lastUpdated: null }) => {
    const store = DB_TABLES.TOKENS;

    try {
        const tokensHash = await configsDB.getAllTokensByChainHash(chain);
        if (!isNeedToUpdate(tokensHash, lastUpdated)) return tokensHash;
    } catch (error) {
        logger.error('Error while getting tokens from indexedDB', error);
    }

    try {
        await configsDB.bulkDeleteByKeys(store, 'chain', chain);

        const { data }: AxiosResponse = await axiosInstance.get(`networks/${chain}/tokens`);

        const formatted = await configsDB.saveTokensConfig(data, ecosystem as any, chain, lastUpdated);

        return formatted;
    } catch (err) {
        logger.error('Error while getting tokens from API', err);
        return {};
    }
};

export const getBlocknativeConfig = async () => {
    try {
        const { data }: AxiosResponse = await axiosInstance.get('networks/chain-list');
        return data || [];
    } catch (error) {
        logger.error('Error while getting blocknative config from API', error);
        return [];
    }
};

export const getLastUpdated = async () => {
    try {
        const { data }: AxiosResponse = await axiosInstance.get('networks/last-updated');
        return data || null;
    } catch (error) {
        logger.error('Error while getting last updated from API', error);
        return {};
    }
};
