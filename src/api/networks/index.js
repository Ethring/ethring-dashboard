import _ from 'lodash';

import HttpRequest from '../../shared/utils/request';

import { ECOSYSTEMS } from '../../Adapter/config';

import IndexedDBService from '../../modules/IndexedDb-v2';

import { DP_CHAINS } from '../data-provider/chains';

import logger from '../../logger';

const indexedDB = new IndexedDBService('configs');

export const getConfigsByEcosystems = async (ecosystem = ECOSYSTEMS.EVM, { isCosmology = false } = {}) => {
    let query = '';

    const store = isCosmology ? 'cosmology' : 'networks';

    const list = await indexedDB.getAllObjectFrom(store, 'ecosystem', ecosystem);

    if (ecosystem === ECOSYSTEMS.COSMOS) {
        query = '/all';
    }

    if (isCosmology) {
        query = '/all?cosmology=true';
    }

    if (Object.keys(list).length) {
        logger.debug('Networks list from indexedDB', Object.keys(list).length);
        return list;
    }

    try {
        const URL = `${import.meta.env.VITE_ZOMET_CORE_API_URL}/networks/${ecosystem.toLowerCase()}${query}`;

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

export const getTokensConfigByChain = async (chain, ecosystem) => {
    const list = await indexedDB.getAllObjectFrom('tokens', 'chain', chain);

    if (Object.keys(list).length) {
        logger.debug('Tokens list from indexedDB', Object.keys(list).length);
        return list;
    }

    try {
        const URL = `${import.meta.env.VITE_ZOMET_CORE_API_URL}/networks/${chain}/tokens`;

        const { data } = await HttpRequest.get(URL);

        if (!_.isEqual(list, data)) {
            await indexedDB.saveTokensObj('tokens', data, { network: chain, ecosystem });
        }

        return data;
    } catch (err) {
        logger.error('Error while getting tokens from API', err);
        return {};
    }
};
