import { BalanceType, RecordList, RecordOptions } from './models/types';

import { formatResponse } from './format';

import BalancesDB from '@/services/indexed-db/balances';

import { Type, TIME_TO_BLOCK } from './models/enums';

// * Store balance for account in Vuex and IndexedDB by type
export const storeBalanceForAccount = async (
    type: BalanceType,
    account: string,
    chain: string,
    address: string,
    balances: RecordList,
    opt: RecordOptions = {},
) => {
    const { store } = opt;

    // if result is empty set loading value for chain
    if (!balances || !balances.length) return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });

    // * Format tokens and save to store
    const formatted = formatResponse(type, balances, { ...opt, chain });

    try {
        // * Save data to indexedDB cache to load data page faster
        await BalancesDB.saveBalancesByTypes(formatted, { dataType: type, account, address, chain, provider: opt.provider as string });
        await store.dispatch('tokens/setLoadFromIndexedDB', { account, chain, value: true });

        // * Save data to Vuex store (Only for tokens and pools)
        if (![Type.integrations, Type.nfts].includes(type))
            await store.dispatch('tokens/setDataFor', { type, account, chain, data: formatted });

        const { total, assetsBalance } = await BalancesDB.getTotalBalance(account);

        // * Save total balance to Vuex store
        await Promise.all([
            store.dispatch('tokens/setTotalBalances', { account, data: total }),
            store.dispatch('tokens/setAssetsBalances', { account, data: assetsBalance }),
        ]);
    } catch (error) {
        console.error(`[storeBalanceForAccount] ${type}`, error);
    } finally {
        await store.dispatch('tokens/setLoadFromIndexedDB', { account, chain, value: false });
    }
};

// * Check if balance is updated in last {TIME_TO_BLOCK} seconds to block balance update to avoid limit exceeded

export const checkIfBalanceIsUpdated = async (account: string, chain: string, provider: string) => {
    try {
        // 1. Get balance for provider
        const balance = (await BalancesDB.getBalanceForProvider(provider, 'tokens', account, chain)) as any;

        // 2. Get updatedAt from balance
        const { updatedAt } = balance || {};

        // 3. If balance is not updated return false, and allow balance update
        if (!updatedAt) return false;

        // 4. Get current timestamp
        const currentTimestamp = Number(new Date());

        // 6. If balance was updated less than {TIME_TO_BLOCK} seconds return true and block balance update
        return currentTimestamp - updatedAt < TIME_TO_BLOCK;
    } catch (error) {
        console.error('[checkIfBalanceIsUpdated]', error);
        return false;
    }
};
