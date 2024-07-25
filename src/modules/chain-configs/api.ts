import { isEqual } from 'lodash';
import { AxiosResponse, HttpStatusCode } from 'axios';
import ApiClient from '@/shared/axios';

import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

import IndexedDBService from '@/services/indexed-db';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';

const indexedDB = new IndexedDBService('configs', 3);

const apiClient = new ApiClient({
    baseURL: process.env.CORE_API || '',
});

const axiosInstance = apiClient.getInstance();

const isNeedToUpdate = (list: any, store: string, chain: string, lastUpdated?: string | null) => {
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

    const list = await indexedDB.getAllObjectFrom(store, 'ecosystem', ecosystem, { index: 'chain' });

    if (!isNeedToUpdate(list, store, ecosystem, lastUpdated)) return list;

    try {
        await indexedDB.bulkDeleteByKeys(store, 'ecosystem', ecosystem);

        const { data, status }: AxiosResponse = await axiosInstance.get(`networks/${ecosystem.toLowerCase()}${query}`);

        if (status !== HttpStatusCode.Ok) return {};

        if (!isEqual(list, data)) await indexedDB.saveNetworksObj(store, data, { ecosystem, lastUpdated });

        return data;
    } catch (err) {
        logger.error('Error while getting networks from API', err);
        return {};
    }
};

export const getCosmologyTokensConfig = async ({ lastUpdated } = { lastUpdated: null }) => {
    const store = DB_TABLES.COSMOLOGY_TOKENS;

    const list = await indexedDB.getAllListFrom(store);

    if (!isNeedToUpdate(list, store, 'cosmology', lastUpdated)) return list;

    try {
        await indexedDB.clearTable(store);

        const { data }: AxiosResponse = await axiosInstance.get(`networks/cosmos/all/tokens`);

        await indexedDB.saveCosmologyAssets(store, data, { lastUpdated });

        return data;
    } catch (err) {
        logger.error('Error while getting cosmology tokens from API', err);
        return {};
    }
};

export const getTokensConfigByChain = async (chain: string, ecosystem: string, { lastUpdated } = { lastUpdated: null }) => {
    const store = DB_TABLES.TOKENS;

    const list = await indexedDB.getAllObjectFrom(store, 'chain', chain);

    if (!isNeedToUpdate(list, store, chain, lastUpdated)) return list;

    try {
        await indexedDB.bulkDeleteByKeys(store, 'chain', chain);

        const { data }: AxiosResponse = await axiosInstance.get(`networks/${chain}/tokens`);

        const formatted = await indexedDB.saveTokensObj(store, data, { network: chain, ecosystem, lastUpdated });

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
