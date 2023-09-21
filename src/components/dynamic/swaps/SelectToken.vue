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

import useTokens from '@/compositions/useTokens';

import SelectToken from '@/components/ui/SelectToken.vue';

import PricesModule from '@/modules/prices/';

import { sortByKey, searchByKey } from '@/helpers/utils';

export default {
    name: 'SelectTokenPage',
    components: {
        SelectToken,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const loader = computed(() => store.getters['tokens/loader']);

        const { allTokensFromNetwork } = useTokens();

        const searchValue = ref('');

        const selectType = computed(() => store.getters['swapOps/selectType']);

        const selectedNetwork = computed(() => store.getters['swapOps/selectedNetwork']);

        const selectedTokenFrom = computed(() => store.getters['swapOps/fromToken']);
        const selectedTokenTo = computed(() => store.getters['swapOps/toToken']);

        onMounted(() => {
            const { chain_id, chainId } = selectedNetwork.value || {};

            if (!chain_id && !chainId) {
                return router.push('/main');
            }
        });

        const tokensList = computed(() => {
            const { net } = selectedNetwork.value || {};
            const list = store.getters['tokens/getTokensListForChain'](net);
            return sortByKey(list, 'balanceUsd');
        });

        const allTokens = computed(() => {
            if (!selectedNetwork.value || !tokensList.value) {
                return [];
            }

            const { net } = selectedNetwork.value || {};

            const isFrom = selectType.value === 'from';

            const tokens = isFrom ? tokensList.value : [...tokensList.value, ...allTokensFromNetwork(net)];

            const secondToken = isFrom ? selectedTokenTo.value : selectedTokenFrom.value;

            if (!searchValue.value) {
                return tokens;
            }

            return tokens.filter(
                (elem) =>
                    elem?.code !== secondToken?.code &&
                    (searchByKey(elem, searchValue.value, 'name') ||
                        searchByKey(elem, searchValue.value, 'code') ||
                        searchByKey(elem, searchValue.value, 'address'))
            );
        });

        const filterTokens = (val) => (searchValue.value = val);

        const setToken = async (item) => {
            if (selectType.value === 'from') {
                store.dispatch('swapOps/setFromToken', item);
            }

            if (selectType.value === 'to' && item.latest_price) {
                store.dispatch('swapOps/setToToken', item);
            }

            if (!item.latest_price) {
                const { chain_id, chainId } = selectedNetwork.value || {};

                const requestPriceFor = {
                    chainId: chain_id || chainId,
                    addresses: item.address,
                };

                const price = await PricesModule.Coingecko.priceByPlatformContracts(requestPriceFor);

                item.latest_price = price[item.address]?.usd;

                store.dispatch('swapOps/setToToken', item);
            }

            return router.push(router.options.history.state.back);
        };

        return {
            loader,

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
