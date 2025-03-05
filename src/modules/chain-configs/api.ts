import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import ApiClient from '@/shared/axios';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

import ConfigsDB from '@/services/indexed-db/configs';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';
import { EVM_CHAIN_IDS } from '@/core/balance-provider/models/enums';

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
        const configsHash = await ConfigsDB.getAllNetworksByEcosystemHash(ecosystem, isCosmology);
        if (!isNeedToUpdate(configsHash, lastUpdated)) return configsHash;
    } catch (error) {
        logger.error('Error while getting networks from indexedDB', error);
    }

    try {
        // ! Clear the table before saving new data
        await ConfigsDB.bulkDeleteByKeys(store, 'ecosystem', ecosystem);

        const { data, status }: AxiosResponse = await axiosInstance.get(`networks/${ecosystem.toLowerCase()}${query}`);

        if (status !== HttpStatusCode.Ok) return {};

        // * Save the data to indexedDB
        await ConfigsDB.saveNetworksConfig(store, data, ecosystem, lastUpdated);

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
        const tokensList = await ConfigsDB.getAllCosmologyTokens();
        if (!isNeedToUpdate(tokensList, lastUpdated)) return tokensList;
    } catch (error) {
        logger.error('Error while getting cosmology tokens from indexedDB', error);
    }

    try {
        await ConfigsDB.bulkDeleteByKeys(store, 'chain_name');

        const { data }: AxiosResponse = await axiosInstance.get(`networks/cosmos/all/tokens`);

        await ConfigsDB.saveCosmologyAssets(data, lastUpdated);

        return data;
    } catch (err) {
        logger.error('Error while getting cosmology tokens from API', err);
        return {};
    }
};

export const getTokensConfigByChain = async (chain: string, ecosystem: string, { lastUpdated } = { lastUpdated: null }) => {
    const store = DB_TABLES.TOKENS;

    try {
        const tokensHash = await ConfigsDB.getAllTokensByChainHash(chain);
        if (!isNeedToUpdate(tokensHash, lastUpdated)) return tokensHash;
    } catch (error) {
        logger.error('Error while getting tokens from indexedDB', error);
    }

    try {
        await ConfigsDB.bulkDeleteByKeys(store, 'chain', chain);

        const { data }: AxiosResponse = await axiosInstance.get(`networks/${chain}/tokens`);

        const formatted = await ConfigsDB.saveTokensConfig(data, ecosystem as any, chain, lastUpdated);

        return formatted;
    } catch (err) {
        logger.error('Error while getting tokens from API', err);
        return {};
    }
};

export const getBlocknativeConfig = async () => {
    try {
        const { data }: AxiosResponse = await axiosInstance.get('networks/chain-list');

        if (!data.length) return [];

        return data.filter((chain: any) => EVM_CHAIN_IDS.includes(chain?.id) && chain.rpcUrl) || [];
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

export const getStakeTokens = async () => {
    try {
        // TODO: Add pagination
        const { data }: AxiosResponse = await axiosInstance.get('stake-assets?isAll=true');
        return data || {};
    } catch (error) {
        logger.error('Error while getting stake tokens from API', error);
        return [];
    }
};

export const getDefiAssets = async () => {
    try {
        // TODO: Add pagination
        const { data }: AxiosResponse = await axiosInstance.get('defi-assets?isAll=true');
        return data || {};
    } catch (error) {
        logger.error('Error while getting stake tokens from API', error);
        return [];
    }
};
