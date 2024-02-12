import _, { List } from 'lodash';

import { BalanceType, RecordList, RecordOptions, AssetBalance, IntegrationBalance, NftBalance } from './models/types';

import { formatResponse } from './format';

import IndexedDBService from '../IndexedDb-v2';

const balancesDB = new IndexedDBService('balances', 1);

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
    if (!balances || !balances.length) {
        return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    }

    // * Format tokens and save to store
    const formatted = formatResponse(type, balances, { ...opt, chain });
    await store.dispatch('tokens/setDataFor', { type, account, chain, data: formatted });

    // * Save data to indexedDB cache to load data page faster
    await balancesDB.saveBalancesByTypes('balances', formatted, { type, account, chain, address });
};
