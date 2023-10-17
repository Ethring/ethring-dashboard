import { getBalancesByAddress } from '@/api/data-provider';

import store from '@/store/';

export async function updateWalletBalances(address, network, balanceUpdated = () => {}) {
    const tokensByChain = store.getters['tokens/groupTokens'];

    const tokensByAccount = store.getters['tokens/tokens'];

    const { net, logo } = network;

    const result = await getBalancesByAddress(net, address, {
        fetchTokens: true,
        fetchIntegrations: false,
    });

    if (!result.tokens || !result.tokens.length) {
        return;
    }

    tokensByChain[net].list = result.tokens;

    for (const item of result.tokens) {
        const index = tokensByAccount[address].findIndex(
            (elem) => (elem.symbol === item.symbol && elem.address === item.address) || (!item.address && elem.symbol === item.symbol)
        );
        if (index !== -1) {
            item.chainLogo = logo;
            tokensByAccount[address][index] = item;
        } else {
            tokensByAccount[address].push(item);
        }
    }

    store.dispatch('tokens/setDataFor', {
        type: 'tokens',
        account: address,
        data: tokensByAccount[address],
    });

    store.dispatch('tokens/setGroupTokens', tokensByChain);

    balanceUpdated();
}
