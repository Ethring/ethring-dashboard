import _ from 'lodash';
import { AxiosResponse, HttpStatusCode } from 'axios';
import ApiClient from '@/shared/axios';

import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

import IndexedDBService from '@/services/indexed-db';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';

const indexedDB = new IndexedDBService('configs');

const apiClient = new ApiClient({
    baseURL: process.env.CORE_API || '',
});

const axiosInstance = apiClient.getInstance();
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const isTwoDaysPassed = (list: any, store: string, chain: string) => {
    let token = null;

    if (Array.isArray(list)) token = list[0];
    else if (typeof list === 'object') token = Object.values(list)[0];

    const { updated_at: updatedAt = null } = token || {};

    const now = new Date().getTime();

    if (!updatedAt) return false;

    const isTwoDays = Math.abs(now - new Date(updatedAt).getTime()) / DAY_IN_MS > 2;

    const isListEmpty = Array.isArray(list) ? !list.length : !Object.keys(list).length;

    if (!isListEmpty && !isTwoDays && updatedAt) return true;

    return false;
};

export const getConfigsByEcosystems = async (ecosystem = ECOSYSTEMS.EVM, { isCosmology = false } = {}) => {
    let query = '';

    if (ecosystem === ECOSYSTEMS.COSMOS) query = '/all';
    if (isCosmology) query = '/all?cosmology=true';

    const store = isCosmology ? DB_TABLES.COSMOLOGY_NETWORKS : DB_TABLES.NETWORKS;

    const list = await indexedDB.getAllObjectFrom(store, 'ecosystem', ecosystem, { index: 'chain' });

    if (isTwoDaysPassed(list, store, ecosystem)) return list;

    try {
        await indexedDB.bulkDeleteByKeys(store, 'ecosystem', ecosystem);

        const { data, status }: AxiosResponse = await axiosInstance.get(`networks/${ecosystem.toLowerCase()}${query}`);

        if (status !== HttpStatusCode.Ok) return {};

        if (!_.isEqual(list, data)) await indexedDB.saveNetworksObj(store, data, { ecosystem });

        return data;
    } catch (err) {
        logger.error('Error while getting networks from API', err);
        return {};
    }
};

export const getCosmologyTokensConfig = async () => {
    const store = DB_TABLES.COSMOLOGY_TOKENS;

    const list = await indexedDB.getAllListFrom(store);

    if (isTwoDaysPassed(list, store, 'cosmology')) return list;

    try {
        await indexedDB.clearTable(store);

        const { data }: AxiosResponse = await axiosInstance.get(`networks/cosmos/all/tokens`);

        await indexedDB.saveCosmologyAssets(store, data);

        return data;
    } catch (err) {
        logger.error('Error while getting cosmology tokens from API', err);
        return {};
    }
};

export const getTokensConfigByChain = async (chain: string, ecosystem: string) => {
    const store = DB_TABLES.TOKENS;

    const list = await indexedDB.getAllObjectFrom(store, 'chain', chain);

    if (isTwoDaysPassed(list, store, chain)) return list;

    try {
        await indexedDB.bulkDeleteByKeys(store, 'chain', chain);

        const { data }: AxiosResponse = await axiosInstance.get(`networks/${chain}/tokens`);

        const formatted = await indexedDB.saveTokensObj(store, data, { network: chain, ecosystem });

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
