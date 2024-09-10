import { BalanceType, RecordList, RecordOptions } from './models/types';

import { formatResponse } from './format';

import BalancesDB from '@/services/indexed-db/balances';

import { Type } from './models/enums';

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
        await BalancesDB.saveBalancesByTypes(formatted, { dataType: type, account, address, chain });
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
