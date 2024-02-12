// TODO: move to the isolated module and use TS
import _ from 'lodash';

import { ECOSYSTEMS } from '@/Adapter/config';

import { DP_CHAINS } from '@/modules/balance-provider/models/enums';

import IndexedDBService from '@/modules/IndexedDb-v2';

import logger from '@/shared/logger';
import HttpRequest from '@/shared/utils/request';

import { DB_TABLES } from '@/shared/constants/indexedDb';

const indexedDB = new IndexedDBService('configs');

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
        const URL = `${process.env.CORE_API}/networks/${ecosystem.toLowerCase()}${query}`;

        const { data } = await HttpRequest.get(URL);

        const filteredNets = {};

        for (const dpChain in DP_CHAINS) {
            const chain = DP_CHAINS[dpChain];
            data[chain] && (filteredNets[chain] = data[chain]);
        }

        if (!_.isEqual(list, filteredNets)) {
            await indexedDB.saveNetworksObj(store, filteredNets, { ecosystem });
        }

        return filteredNets;
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
        const URL = `${process.env.CORE_API}/networks/cosmos/all/tokens`;

        const { data } = await HttpRequest.get(URL);

        await indexedDB.saveCosmologyAssets(store, data);

        return data;
    } catch (err) {
        logger.error('Error while getting cosmology tokens from API', err);
        return {};
    }
};

export const getTokensConfigByChain = async (chain, ecosystem) => {
    const store = DB_TABLES.TOKENS;

    const list = await indexedDB.getAllObjectFrom(store, 'chain', chain);

    if (Object.keys(list).length) {
        return list;
    }

    try {
        const URL = `${process.env.CORE_API}/networks/${chain}/tokens`;

        const { data } = await HttpRequest.get(URL);

        const formatted = await indexedDB.saveTokensObj(store, data, { network: chain, ecosystem });

        return formatted;
    } catch (err) {
        logger.error('Error while getting tokens from API', err);
        return {};
    }
};
