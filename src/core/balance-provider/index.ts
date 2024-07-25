import { getBalancesByAddress } from '@/core/balance-provider/api';

import RequestQueue from '@/core/balance-provider/queue';

import store from '@/app/providers/store.provider';

import { Type, BaseType, POOL_BALANCES_CHAINS, DP_CHAINS } from '@/core/balance-provider/models/enums';
import { ChainAddresses, BalanceResponse, BalanceType, RecordOptions, ProviderRequestOptions } from '@/core/balance-provider/models/types';

import { storeBalanceForAccount } from '@/core/balance-provider/utils';

import PortalFiApi from '@/modules/portal-fi/api';

const DEFAULT_PROVIDER = 'Pulsar';

export const updateBalanceForAccount = async (account: string, addresses: ChainAddresses, opt: RecordOptions = {}) => {
    const queue = new RequestQueue();

    let isUpdate = opt.isUpdate || false;

    const isInitCalled = store.getters['tokens/isInitCalled'](account, opt.provider);

    if (!isInitCalled) {
        store.dispatch('tokens/setIsInitCall', { account, provider: opt.provider, time: Date.now() });
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

    const isInitCalled = store.getters['tokens/isInitCalled'](account, opt.provider);

    if (isInitCalled && !isUpdate) return;

    const providerOptions: ProviderRequestOptions = {
        provider: opt.provider || DEFAULT_PROVIDER,
        fetchTokens: opt.fetchTokens || false,
        fetchIntegrations: opt.fetchIntegrations || false,
        fetchNfts: opt.fetchNfts || false,
    };

    try {
        store.dispatch('tokens/setLoadingByChain', { chain, account, value: true });

        const balanceForChain: BalanceResponse | null = await getBalancesByAddress(chain, address, providerOptions);

        if (!balanceForChain) return store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });

        for (const type in BaseType)
            await storeBalanceForAccount(type as BalanceType, account, chain, address, balanceForChain[type] as any, { ...opt, store });

        if (POOL_BALANCES_CHAINS.includes(chain as DP_CHAINS)) {
            const pools = await loadUsersPoolList(chain, address);
            await storeBalanceForAccount(Type.pools, account, chain, address, pools, { ...opt, store });
        }
    } catch (error) {
        console.error('Error getting balance for chain', chain, error);
    } finally {
        await store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
    }
};

export const loadUsersPoolList = async (net: string, ownerAddress: string) => {
    const poolService = new PortalFiApi();

    const response = await poolService.getUserBalancePoolList({ net, ownerAddress });

    return response;
};
