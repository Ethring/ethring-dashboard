import { getBalancesByAddress } from '@/api/data-provider';

import IndexedDBService from '@/modules/indexedDb';

import store from '@/store/';

export async function updateWalletBalances(account, address, network, balanceUpdated = () => {}) {
    const tokensByAccount = store.getters['tokens/tokens'];

    const { net, logo } = network;

    const result = await getBalancesByAddress(net, address, {
        fetchTokens: true,
        fetchIntegrations: false,
    });

    if (!result || !result.tokens || !result.tokens.length) {
        return;
    }

    for (let item of result.tokens) {
        const index = tokensByAccount[account].findIndex(
            (elem) => (elem.symbol === item.symbol && elem.address === item.address) || (!item.address && elem.symbol === item.symbol)
        );
        item = formatRecord(item, { net, address, logo });
        if (index !== -1) {
            tokensByAccount[account][index] = item;
        } else {
            tokensByAccount[account].push(item);
        }
    }

    store.dispatch('tokens/setDataFor', {
        type: 'tokens',
        account,
        data: tokensByAccount[account],
    });

    const tokens = result.tokens.map((elem) => {
        return formatRecord(elem, { net, address, logo });
    });

    store.dispatch('tokens/setGroupTokens', { chain: net, account, data: { list: tokens } });

    balanceUpdated(tokens);

    const key = `${account}-${net}-${address}`;

    const cachedData = await IndexedDBService.getData(key);
    cachedData.tokens = result.tokens;

    await IndexedDBService.saveData(key, cachedData);
}

const formatRecord = (record, { net, address, logo }) => {
    record.id = `${net}_${address}_${record.symbol}`;
    record.chainLogo = logo;
    record.chain = net;

    return record;
};
