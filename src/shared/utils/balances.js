import { getBalancesByAddress, DP_COSMOS } from '@/api/data-provider';
import { formatRecord } from '../../modules/Balances/utils';
import IndexedDBService from '@/modules/indexedDb';

import store from '@/store/';
import _ from 'lodash';

const saveToCache = async (account, chainId, address, tokenBalances) => {
    try {
        const key = `${account}-${chainId}-${address}`;
        const cachedData = await IndexedDBService.getData(key);

        cachedData.tokens = tokenBalances;

        await IndexedDBService.saveData(key, cachedData);
    } catch (error) {
        console.error('[balances -> saveToCache]', error);
    }
};

export async function updateWalletBalances(account, address, network, cb = () => {}) {
    let isUpdated = false;

    const { net, logo } = network || {};

    if (!net) {
        return;
    }

    // CHAIN_ID for API
    const chainId = DP_COSMOS[net] || net;

    store.dispatch('tokens/setLoader', true);
    store.dispatch('tokens/setLoadingByChain', { chain: chainId, value: true });

    // Getting tokens from API by address
    const response = await getBalancesByAddress(chainId, address, {
        fetchTokens: true,
        fetchIntegrations: false,
    });

    const { tokens: tokenBalances = [] } = response || {};

    // if no tokens - skip
    if (!tokenBalances.length) {
        return;
    }

    // Getting tokens from store by account
    const tokensListFromStore = store.getters['tokens/tokens'];
    let accTokens = tokensListFromStore[account] || [];

    // making hash for faster search
    let accTokensHash = _.chain(accTokens).keyBy('id').mapValues().value();

    // removing from memory after making hash
    accTokens = null;

    // updating tokens from API with tokens from store
    for (const token of tokenBalances) {
        formatRecord(token, { net: chainId, chain: net, address, logo });

        // if token exists in store and balance is the same - skip
        if (accTokensHash[token.id] && accTokensHash[token.id].balance === token.balance) {
            continue;
        }

        // if token exists in store and balance is different - update
        // if token doesn't exist in store - add
        accTokensHash[token.id] = token;

        // updating flag
        isUpdated = true;
    }

    store.dispatch('tokens/setLoader', false);
    store.dispatch('tokens/setLoadingByChain', { chain: chainId, value: false });

    // if no updates - skip
    if (!isUpdated) {
        // removing from memory if no updates
        accTokensHash = null;

        return;
    }

    // updating store
    store.dispatch('tokens/setDataFor', {
        type: 'tokens',
        account,
        data: _.values(accTokensHash),
    });

    // updating store
    store.dispatch('tokens/setGroupTokens', { chain: chainId, account, data: { list: tokenBalances } });

    // removing from memory after updating store
    accTokensHash = null;

    cb(tokenBalances);

    await saveToCache(account, chainId, address, tokenBalances);
}
