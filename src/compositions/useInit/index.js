import { computed, watch } from 'vue';

import { callFetchBalances } from '../../modules/Balances/fetchData';
import { getBalancesByAddress } from '../../api/data-provider';

import { getDataFromIndexedCache, prepareChainWithAddress } from '../../modules/Balances/utils';
import { checkActions } from '../../modules/Balances/helpers';

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

        const chainList = computed(() => store.getters['networks/zometNetworksList']);
        const nativeTokens = computed(() => store.getters['tokens/nativeTokens']);

        if (!nativeTokens.value || !nativeTokens.value[account]) {
            return;
        }

        for (const network of chainList.value) {
            if (network.native_token.price) {
                continue;
            }
            const nativeToken = computed(() => store.getters['tokens/getNativeTokenForChain'](account, network.net));

            if (nativeToken.value) {
                network.native_token.price = nativeToken.value.price;
            }
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
