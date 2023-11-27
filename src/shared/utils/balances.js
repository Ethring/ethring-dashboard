import { getBalancesByAddress } from '@/api/data-provider';
import { formatRecord } from '../../compositions/useInit/utils';
import IndexedDBService from '@/modules/indexedDb';

import store from '@/store/';

const COSMOS_CHAIN_ID = {
    cosmoshub: 'cosmos',
    osmosis: 'osmosis',
    juno: 'juno',
    injective: 'injective',
    kujira: 'kujira',
    crescent: 'crescent',
    mars: 'mars',
    stargaze: 'stargaze',
    terra2: 'terra2',
};

export async function updateWalletBalances(account, address, network, balanceUpdated = () => {}) {
    const tokensByAccount = store.getters['tokens/tokens'];

    const { net, logo } = network;

    const chainId = COSMOS_CHAIN_ID[net] || net;

    const result = await getBalancesByAddress(chainId, address, {
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

        item = formatRecord(item, { net: chainId, chain: net, address, logo });

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
        return formatRecord(elem, { net: chainId, chain: net, address, logo });
    });

    store.dispatch('tokens/setGroupTokens', { chain: chainId, account, data: { list: tokens } });

    balanceUpdated(tokens);

    const key = `${account}-${chainId}-${address}`;

    const cachedData = await IndexedDBService.getData(key);
    cachedData.tokens = result.tokens;

    await IndexedDBService.saveData(key, cachedData);
}
