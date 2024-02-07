import _ from 'lodash';

import { getBalancesByAddress, DP_COSMOS } from '@/api/data-provider';
import { formatRecord } from '@/modules/Balances/utils';
import IndexedDBService from '@/modules/indexedDb';

import store from '@/app/providers/store.provider.js';

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
    const { net, logo } = network || {};

    if (!net) {
        return;
    }

    // CHAIN_ID for API
    const chainId = DP_COSMOS[net] || net;

    // Getting tokens from API by address
    const response = await getBalancesByAddress(chainId, address, { fetchIntegrations: false, fetchNfts: false });

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
        formatRecord(token, { store, net: chainId, chain: net, address, logo, type: 'asset' });

        // if token exists in store and balance is the same - skip
        if (accTokensHash[token.id] && accTokensHash[token.id].balance === token.balance) {
            continue;
        }

        // if token exists in store and balance is different - update
        // if token doesn't exist in store - add
        accTokensHash[token.id] = token;

        // updating flag
        // isUpdated = true;
    }

    // console.log('[updateWalletBalances] isUpdated', isUpdated, accTokensHash);

    // // if no updates - skip
    // if (!isUpdated) {
    //     // removing from memory if no updates
    //     accTokensHash = null;

    //     return;
    // }

    // updating store
    await store.dispatch('tokens/setDataFor', {
        type: 'tokens',
        account,
        data: _.values(accTokensHash),
    });

    // updating store
    store.dispatch('tokens/setGroupTokens', { chain: chainId, account, data: { list: tokenBalances } });

    cb(tokenBalances);

    // removing from memory after updating store
    accTokensHash = null;

    await saveToCache(account, chainId, address, tokenBalances);
}
