<template>
    <div class="select-token">
        <div class="select-token__page">
            <SelectToken :tokensLoading="loader" :tokens="allTokens" @filterTokens="filterTokens" @setToken="setToken" />
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex';

import { computed, ref, onMounted } from 'vue';

import { useRouter } from 'vue-router';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

import SelectToken from '@/components/ui/SelectToken.vue';

import prices from '@/modules/prices/';

export default {
    name: 'SelectTokenPage',
    components: {
        SelectToken,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { walletAddress } = useWeb3Onboard();
        const { groupTokens, allTokensFromNetwork } = useTokens();

        const searchValue = ref('');

        const selectedNetwork = computed(() => store.getters['networks/selectedNetwork']);
        const selectType = computed(() => store.getters['tokens/selectType']);
        const selectedTokenFrom = computed(() => store.getters['tokens/fromToken']);
        const selectedTokenTo = computed(() => store.getters['tokens/toToken']);
        const loader = computed(() => store.getters['tokens/loader']);

        onMounted(async () => {
            const chainId = selectedNetwork.value?.chain_id || selectedNetwork.value?.chainId;
            if (!chainId) {
                router.push('/swap');
            }
        });

        const allTokens = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }
            let wallet = groupTokens.value.find((elem) => elem.net === selectedNetwork.value.net);
            let list = [];

            const listWithBalances = groupTokens.value[0].list;

            if (selectType.value === 'from') {
                list = listWithBalances;
            } else {
                list = [
                    ...listWithBalances,
                    ...allTokensFromNetwork(wallet.net).filter((token) => {
                        return !listWithBalances.find((t) => t.address?.toLowerCase() === token.address?.toLowerCase());
                    }),
                ];
            }

            const secondToken = selectType.value === 'from' ? selectedTokenTo.value : selectedTokenFrom.value;

            return list.filter(
                (elem) =>
                    elem?.code !== secondToken?.code &&
                    (byTokenKey(elem, searchValue.value, 'name') ||
                        byTokenKey(elem, searchValue.value, 'code') ||
                        byTokenKey(elem, searchValue.value, 'address'))
            );
        });

        const byTokenKey = (token = {}, search = '', target = 'code') => {
            const targetVal = token[target] ?? null;
            const targetLC = targetVal ? targetVal.toLowerCase() : '';
            return targetLC.includes(search.toLowerCase());
        };

        const filterTokens = (val) => {
            searchValue.value = val;
        };

        const setToken = async (item) => {
            if (selectType.value === 'from') {
                store.dispatch('tokens/setFromToken', item);
            } else {
                if (item.balance?.price?.USD) {
                    store.dispatch('tokens/setToToken', item);
                } else {
                    const price = await prices.Coingecko.priceByPlatformContracts({
                        chainId: selectedNetwork.value?.chain_id || selectedNetwork.value?.chainId,
                        addresses: item.address,
                    });
                    item.balance.price = {
                        BTC: price[item.address]?.btc,
                        USD: price[item.address]?.usd,
                    };
                    store.dispatch('tokens/setToToken', item);
                }
            }
            router.push(router.options.history.state.back);
        };

        return {
            loader,
            groupTokens,
            walletAddress,
            router,
            allTokens,
            searchValue,
            filterTokens,
            setToken,
        };
    },
};
</script>
<style lang="scss" scoped>
.select-token {
    @include pageStructure;
    &__page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);
        position: relative;
    }
}
body.dark {
}
</style>
