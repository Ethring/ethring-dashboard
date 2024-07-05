import { getBalancesByAddress } from '@/core/balance-provider/api';

import RequestQueue from '@/core/balance-provider/queue';

import store from '@/app/providers/store.provider';

import { Type, BaseType, POOL_BALANCES_CHAINS } from '@/core/balance-provider/models/enums';
import { ChainAddresses, BalanceResponse, BalanceType, RecordOptions, ProviderRequestOptions } from '@/core/balance-provider/models/types';

import { storeBalanceForAccount } from '@/core/balance-provider/utils';

import PortalFiApi from '@/modules/portal-fi/api';

export const updateBalanceForAccount = async (account: string, addresses: ChainAddresses, opt: RecordOptions = {}) => {
    const queue = new RequestQueue();

    let isUpdate = false;

    const isInitCalled = store.getters['tokens/isInitCalled'](account);

    if (!isInitCalled) {
        store.dispatch('tokens/setIsInitCall', { account, time: Date.now() });
        isUpdate = true;
    }

    // * Load balances from IndexedDB cache
    for (const chain in addresses) {
        const { address } = addresses[chain];

        await store.dispatch('tokens/setLoadingByChain', { chain, account, value: true });

        for (const type in Type) await store.dispatch('tokens/loadFromCache', { account, chain, address, type });

        await store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    }

    // * Get data from API
    for (const chain in addresses) {
        const { address, logo, nativeTokenLogo } = addresses[chain];

        queue.add(async () => await updateBalanceByChain(account, address, chain, { ...opt, isUpdate, logo, nativeTokenLogo }));
    }
};

export const updateBalanceByChain = async (account: string, address: string, chain: string, opt: RecordOptions = {}) => {
    const { isUpdate = false } = opt;

    const isInitCalled = store.getters['tokens/isInitCalled'](account);

    if (isInitCalled && !isUpdate) return;

    const providerOptions: ProviderRequestOptions = {
        fetchTokens: true,
        fetchIntegrations: true,
        fetchNfts: true,
    };

    if (!isInitCalled && isUpdate) {
        providerOptions.fetchIntegrations = false;
        providerOptions.fetchNfts = false;
    }

    try {
        store.dispatch('tokens/setLoadingByChain', { chain, account, value: true });

        const balanceForChain: BalanceResponse | null = await getBalancesByAddress(chain, address, providerOptions);

        if (!balanceForChain) return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });

        for (const type in BaseType)
            await storeBalanceForAccount(type as BalanceType, account, chain, address, balanceForChain[type], { ...opt, store });

        if (POOL_BALANCES_CHAINS.includes(chain)) {
            const pools = await loadUsersPoolList(chain, address);
            await storeBalanceForAccount(Type.pools, account, chain, address, pools, { ...opt, store });
        }

        return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    } catch (error) {
        console.error('Error getting balance for chain', chain, error);
        store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    }
};

export const loadUsersPoolList = async (net: string, ownerAddress: string) => {
    const poolService = new PortalFiApi();

    const response = await poolService.getUserBalancePoolList({ net, ownerAddress });

    return response;
};
