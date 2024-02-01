import { ECOSYSTEMS } from '@/Adapter/config';
import { DP_COSMOS } from '@/api/data-provider';

import { formatResponse, saveToCache, storeOperations } from './utils';

// =================================================================================================================
export const formatAndStoreData = async (
    store,
    { chain, account, chainForRequest, chainAddress, logo },
    { mainAllTokens, mainAllIntegrations, mainAllNfts },
    { tokens = [], integrations = [], nfts = [] },
    type = 'cache'
) => {
    const { allTokens, allIntegrations, allNfts } = formatResponse(
        chain,
        { chainForRequest, chainAddress, logo },
        { tokens, integrations, nfts }
    );

    mainAllTokens.push(...allTokens);
    mainAllIntegrations.push(...allIntegrations);
    mainAllNfts.push(...allNfts);

    await storeOperations(
        chain,
        account,
        store,
        {
            chainAddress,
            tokens,
            integrations,
            nfts,
        },
        {
            allTokens: mainAllTokens,
            allIntegrations: mainAllIntegrations,
            allNfts: mainAllNfts,
        }
    );

    return store.dispatch('tokens/setLoadingByChain', { chain, value: type === 'cache' });
};

// =================================================================================================================

export const callFetchBalances = async (
    type = 'cache',
    store,
    chainsWithAddresses,
    { ecosystem, account },
    requestFn = async () => ({ tokens: [], integrations: [], nfts: [] }),
    { allTokens, allIntegrations, allNfts } = {}
) => {
    const ALL_TOKENS = allTokens || [];
    const ALL_INTEGRATIONS = allIntegrations || [];
    const ALL_NFTS = allNfts || [];

    const requestByType = async (type, params) => {
        if (type === 'cache') {
            return await requestFn(`${account}-${DP_COSMOS[params.chain] || params.chain}-${params.info.address}`);
        }

        return await requestFn(DP_COSMOS[params.chain] || params.chain, params.info.address);
    };

    const promises = chainsWithAddresses.map(async (chainInfo) => {
        return await fetchBalanceForChain(
            type,
            store,
            { ecosystem, account },
            {
                allTokens: ALL_TOKENS,
                allIntegrations: ALL_INTEGRATIONS,
                allNfts: ALL_NFTS,
            },
            chainInfo,
            async () => await requestByType(type, { ...chainInfo, account })
        );
    });

    await Promise.all(promises);
};

// =================================================================================================================

// Fetching data from API or Cache and store it in Vuex
export const fetchBalanceForChain = async (
    type,
    store,
    { ecosystem, account },
    { allNfts, allIntegrations, allTokens },
    { chain, info },
    requestFn = async () => ({ tokens: [], integrations: [], nfts: [] })
) => {
    store.dispatch('tokens/setLoadingByChain', { chain, value: true });

    const { logo, address: chainAddress } = info;
    const chainForRequest = DP_COSMOS[chain] || chain;

    if (ecosystem === ECOSYSTEMS.COSMOS && !DP_COSMOS[chain]) {
        return store.dispatch('tokens/setLoadingByChain', { chain, value: false });
    }

    // =========================================================================================================

    const response = await requestFn();

    if (!response) {
        return store.dispatch('tokens/setLoadingByChain', { chain, value: false });
    }

    await formatAndStoreData(
        store,
        { chain, account, chainForRequest, chainAddress, logo },
        {
            mainAllTokens: allTokens,
            mainAllIntegrations: allIntegrations,
            mainAllNfts: allNfts,
        },
        response,
        type
    );

    // =========================================================================================================
    // Cache data

    if (type !== 'cache') {
        return await saveToCache(`${account}-${chainForRequest}-${chainAddress}`, response);
    }
};
