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

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

import SelectToken from '@/components/ui/SelectToken.vue';

export default {
    name: 'SelectTokenPage',
    components: {
        SelectToken,
    },
    setup() {
        const store = useStore();
        const router = useRouter();
        const searchValue = ref('');
        const { groupTokens } = useTokens();
        const { walletAddress, currentChainInfo } = useWeb3Onboard();

        const loader = computed(() => store.getters['tokens/loader']);

        const allTokens = computed(() => {
            if (!currentChainInfo.value) {
                return [];
            }

            const list = groupTokens.value[0].list;

            return list.filter(
                (elem) =>
                    byTokenKey(elem, searchValue.value, 'name') ||
                    byTokenKey(elem, searchValue.value, 'code') ||
                    byTokenKey(elem, searchValue.value, 'address')
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

        const setToken = (item) => {
            store.dispatch('tokens/setFromToken', item);
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
