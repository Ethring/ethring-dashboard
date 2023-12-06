import { computed, watch } from 'vue';

import { callFetchBalances } from '../../modules/Balances/fetchData';
import { getBalancesByAddress } from '../../api/data-provider';

import { getDataFromIndexedCache, prepareChainWithAddress, setNativeTokensPrices } from '../../modules/Balances/utils';
import { checkActions } from '../../modules/Balances/helpers';

import { ECOSYSTEMS } from '@/Adapter/config';

// =================================================================================================================

export default async function useInit(store, { addressesWithChains = {}, account = null, currentChainInfo } = {}) {
    await checkActions(store);

    const allTokensForAccount = computed(() => store.getters['tokens/tokens'][account] || []);
    const allTokensBalance = computed(() => store.getters['tokens/totalBalances'][account] || 0);

    if (allTokensForAccount.value.length > 0 && allTokensBalance.value) {
        return store.dispatch('tokens/setLoader', false);
    }

    const { addresses, chunkedAddresses, ecosystem } = prepareChainWithAddress(addressesWithChains, currentChainInfo);

    // Fetch balances for all chains in parallel
    await callFetchBalances('cache', store, addresses, { ecosystem, account }, getDataFromIndexedCache);

    const getFromAPI = async () => {
        const ALL_TOKENS = [];
        const ALL_INTEGRATIONS = [];
        const ALL_NFTS = [];

        for (const chunk of chunkedAddresses) {
            await callFetchBalances('api', store, chunk, { ecosystem, account }, getBalancesByAddress, {
                allTokens: ALL_TOKENS,
                allIntegrations: ALL_INTEGRATIONS,
                allNfts: ALL_NFTS,
            });
        }

        store.dispatch('tokens/setLoader', false);
        if (ecosystem === ECOSYSTEMS.EVM) {
            await setNativeTokensPrices(store, account);
        }
    };

    if (!store.getters['networks/isConfigLoading']) {
        await getFromAPI();
    }

    watch(
        () => store.getters['networks/isConfigLoading'],
        async (value) => {
            if (value) {
                return;
            }

            await getFromAPI();
        }
    );
}
