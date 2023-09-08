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
        const { groupTokens, allTokensFromNetwork, getTokenList } = useTokens();

        const searchValue = ref('');

        const loader = computed(() => store.getters['tokens/loader']);
        const selectType = computed(() => store.getters['tokens/selectType']);
        const selectedTokenFrom = computed(() => store.getters['tokens/fromToken']);
        const selectedTokenTo = computed(() => store.getters['tokens/toToken']);
        const selectedSrcNetwork = computed(() => store.getters['bridge/selectedSrcNetwork']);
        const selectedDstNetwork = computed(() => store.getters['bridge/selectedDstNetwork']);

        const selectedNetwork = selectType.value === 'from' ? selectedSrcNetwork : selectedDstNetwork;

        onMounted(async () => {
            const chainId = selectedNetwork.value?.chain_id || selectedNetwork.value?.chainId;
            if (!chainId) {
                router.push('/superSwap');
            }
        });

        const allTokens = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }
            let wallet = groupTokens.value.find((elem) => elem.net === selectedNetwork.value.net);
            let list = [];

            const listWithBalances = getTokenList(wallet);
            if (selectType.value === 'from') {
                if (wallet.balance > 0) {
                    list = listWithBalances;
                } else {
                    list = wallet.list;
                }
            } else {
                list = [
                    ...listWithBalances,
                    ...allTokensFromNetwork(selectedNetwork.value.net).filter((token) => {
                        return !listWithBalances.find((t) => t.address?.toLowerCase() === token.address?.toLowerCase());
                    }),
                ];
            }
            const byTokenKey = (token = {}, search = '', target = 'code') => {
                const targetVal = token[target] ?? null;
                const targetLC = targetVal ? targetVal.toLowerCase() : '';
                return targetLC.includes(search.toLowerCase());
            };

            const secondToken = selectType.value === 'from' ? selectedTokenTo.value : selectedTokenFrom.value;
            if (selectedSrcNetwork.value?.net === selectedDstNetwork.value?.net) {
                return list.filter(
                    (elem) =>
                        elem?.code !== secondToken?.code &&
                        (byTokenKey(elem, searchValue.value, 'name') ||
                            byTokenKey(elem, searchValue.value, 'code') ||
                            byTokenKey(elem, searchValue.value, 'address'))
                );
            }
            return list.filter(
                (elem) =>
                    byTokenKey(elem, searchValue.value, 'name') ||
                    byTokenKey(elem, searchValue.value, 'code') ||
                    byTokenKey(elem, searchValue.value, 'address')
            );
        });

        const filterTokens = (val) => {
            searchValue.value = val;
        };

        const setToken = async (item) => {
            if (selectType.value === 'from') {
                store.dispatch('tokens/setFromToken', item);
            } else {
                if (item.latest_price) {
                    store.dispatch('tokens/setToToken', item);
                } else {
                    const price = await prices.Coingecko.priceByPlatformContracts({
                        chainId: selectedDstNetwork.value?.chain_id || selectedDstNetwork.value?.chainId,
                        addresses: item.address,
                    });
                    item.latest_price = price[item.address.toLowerCase()]?.usd;

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
</style>
