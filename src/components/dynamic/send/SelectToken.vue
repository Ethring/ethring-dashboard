<template>
    <div class="select-token">
        <div class="select-token__page">
            <SelectToken :tokensLoading="loader" :tokens="allTokens" @filterTokens="filterTokens" @setToken="setToken" />
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex';

import { computed, ref } from 'vue';

import { useRouter } from 'vue-router';

import { ECOSYSTEMS } from '@/Adapter/config';
import useAdapter from '@/Adapter/compositions/useAdapter';

import SelectToken from '@/components/ui/SelectToken.vue';

import { sortByKey, searchByKey } from '@/helpers/utils';

export default {
    name: 'SelectTokenPage',
    components: {
        SelectToken,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const { walletAddress, currentChainInfo } = useAdapter();

        const searchValue = ref('');

        const loader = computed(() => store.getters['tokens/loader']);

        const tokensList = computed(() => {
            const { net, ecosystem, asset = {} } = currentChainInfo.value;
            const listFromStore = store.getters['tokens/getTokensListForChain'](net);

            // TODO: remove this after adding tokens to the cosmos network
            if (ecosystem === ECOSYSTEMS.COSMOS) {
                const baseToken = listFromStore.find(({ code }) => code === asset.code);

                const tokenInfo = {
                    ...asset,
                    ...baseToken,
                    balance: baseToken?.balance || 0,
                    balanceUsd: baseToken?.balanceUsd || 0,
                };

                return [tokenInfo];
            }

            return sortByKey(listFromStore, 'balance');
        });

        const allTokens = computed(() => {
            if (!currentChainInfo.value || !tokensList.value) {
                return [];
            }

            const list = tokensList.value;

            if (!searchValue.value) {
                return list;
            }

            return list.filter(
                (tkn) =>
                    searchByKey(tkn, searchValue.value, 'name') ||
                    searchByKey(tkn, searchValue.value, 'code') ||
                    searchByKey(tkn, searchValue.value, 'address')
            );
        });

        const filterTokens = (val) => (searchValue.value = val);

        const setToken = (item) => {
            store.dispatch('tokens/setFromToken', item);
            router.push(router.options.history.state.back);
        };

        return {
            loader,
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
