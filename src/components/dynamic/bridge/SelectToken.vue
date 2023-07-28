<template>
    <div class="select-token">
        <div class="select-token__page">
            <SelectToken :tokensLoading="loader" :tokens="allTokens" @filterTokens="filterTokens" @setToken="setToken" />
        </div>
    </div>
</template>
<script>
import { useStore } from 'vuex';
import { computed, onMounted, ref } from 'vue';
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

        const { walletAddress, currentChainInfo } = useWeb3Onboard();
        const { groupTokens, allTokensFromNetwork, getTokenList } = useTokens();

        const selectType = computed(() => store.getters['tokens/selectType']);

        const selectedNetwork =
            selectType.value === 'from'
                ? computed(() => store.getters['bridge/selectedSrcNetwork'])
                : computed(() => store.getters['bridge/selectedDstNetwork']);
        const tokens = computed(() => store.getters['bridge/tokensByChainID']);
        const loader = computed(() => !tokens.value.length);

        onMounted(async () => {
            if (!selectedNetwork.value) {
                store.dispatch(
                    'bridge/setSelectedSrcNetwork',
                    groupTokens.value.find((elem) => elem.net === currentChainInfo.value.net)
                );
            }
            const chainId = selectedNetwork.value?.chain_id || selectedNetwork.value?.chainId;
            if (chainId) {
                await store.dispatch('bridge/getTokensByChain', {
                    chainId,
                });
            } else {
                router.push('/bridge');
            }
        });

        const allTokens = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }

            let list = [];
            const listWithBalances = getTokenList(selectedNetwork.value);

            if (selectType.value === 'from') {
                if (selectedNetwork.value.balance.mainBalance > 0) {
                    list = listWithBalances;
                } else {
                    list = selectedNetwork.value.list;
                }
            } else {
                list = [
                    ...listWithBalances,
                    ...allTokensFromNetwork(selectedNetwork.value.net).filter((token) => {
                        return !listWithBalances.find((t) => t.address?.toLowerCase() === token.address?.toLowerCase());
                    }),
                ];
            }

            const matchingTokens = list?.filter((token) => {
                return tokens.value?.some((listToken) => {
                    return listToken.symbol === token.code;
                });
            });

            const byTokenKey = (token = {}, search = '', target = 'code') => {
                const targetVal = token[target] ?? null;
                const targetLC = targetVal ? targetVal.toLowerCase() : '';
                return targetLC.includes(search.toLowerCase());
            };

            return matchingTokens?.filter(
                (elem) =>
                    byTokenKey(elem, searchValue.value, 'name') ||
                    byTokenKey(elem, searchValue.value, 'code') ||
                    byTokenKey(elem, searchValue.value, 'address')
            );
        });

        const filterTokens = (val) => {
            searchValue.value = val;
        };

        const setToken = (item) => {
            if (selectType.value === 'from') {
                store.dispatch('tokens/setFromToken', item);
            } else {
                store.dispatch('tokens/setToToken', item);
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
