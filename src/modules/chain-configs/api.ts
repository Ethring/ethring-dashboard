import _ from 'lodash';
import { AxiosResponse, HttpStatusCode } from 'axios';
import ApiClient from '@/shared/axios';

import { ECOSYSTEMS } from '@/Adapter/config';

import IndexedDBService from '@/services/indexed-db';

import logger from '@/shared/logger';

import { DB_TABLES } from '@/shared/constants/indexedDb';

const indexedDB = new IndexedDBService('configs');

const apiClient = new ApiClient({
    baseURL: process.env.CORE_API || '',
});

const axiosInstance = apiClient.getInstance();

export const getConfigsByEcosystems = async (ecosystem = ECOSYSTEMS.EVM, { isCosmology = false } = {}) => {
    let query = '';

    const store = isCosmology ? DB_TABLES.COSMOLOGY_NETWORKS : DB_TABLES.NETWORKS;

    const list = await indexedDB.getAllObjectFrom(store, 'ecosystem', ecosystem, { index: 'chain' });

    if (ecosystem === ECOSYSTEMS.COSMOS) {
        query = '/all';
    }

    if (isCosmology) {
        query = '/all?cosmology=true';
    }

    if (Object.keys(list).length) {
        return list;
    }

    try {
        const { data, status }: AxiosResponse = await axiosInstance.get(`networks/${ecosystem.toLowerCase()}${query}`);

        if (status !== HttpStatusCode.Ok) {
            return {};
        }

        if (!_.isEqual(list, data)) {
            await indexedDB.saveNetworksObj(store, data, { ecosystem });
        }

        return data;
    } catch (err) {
        logger.error('Error while getting networks from API', err);
        return {};
    }
};

export const getCosmologyTokensConfig = async () => {
    const store = DB_TABLES.COSMOLOGY_TOKENS;

    const list = await indexedDB.getAllListFrom(store);

    if (Object.keys(list).length) {
        return list;
    }

    try {
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

    if (Object.keys(list).length) {
        return list;
    }

    try {
        const { data }: AxiosResponse = await axiosInstance.get(`networks/${chain}/tokens`);

        const formatted = await indexedDB.saveTokensObj(store, data, { network: chain, ecosystem });

        return formatted;
    } catch (err) {
        logger.error('Error while getting tokens from API', err);
        return {};
    }
};
