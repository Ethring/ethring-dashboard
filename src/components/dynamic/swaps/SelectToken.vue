<template>
    <div class="select-token">
        <div class="select-token__page">
            <SelectToken :tokens="allTokens" @filterTokens="filterTokens" @setToken="setToken" />
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
        const { groupTokens, allTokensFromNetwork } = useTokens();
        const loader = computed(() => store.getters['tokens/loader']);
        const selectedNetwork = computed(() => store.getters['networks/selectedNetwork']);
        const selectType = computed(() => store.getters['tokens/selectType']);
        const { walletAddress } = useWeb3Onboard();
        const selectedTokenFrom = computed(() => store.getters['tokens/fromToken']);
        const selectedTokenTo = computed(() => store.getters['tokens/toToken']);

        const allTokens = computed(() => {
            if (!selectedNetwork.value) {
                return [];
            }

            let list = [
                selectedNetwork.value,
                ...selectedNetwork.value.list,
                ...allTokensFromNetwork(selectedNetwork.value.net).filter((token) => {
                    return token.net !== selectedNetwork.value.net && !selectedNetwork.value.list.find((t) => t.net === token.net);
                }),
            ];
            const secondToken = selectType.value === 'from' ? selectedTokenTo.value : selectedTokenFrom.value;
            return list.filter(
                (elem) =>
                    elem.code !== secondToken.code &&
                    (elem.name.toLowerCase().includes(searchValue.value.toLowerCase()) ||
                        elem.code
                            .toLowerCase()
                            .includes(
                                searchValue.value.toLowerCase() || elem.address.toLowerCase().includes(searchValue.value.toLowerCase())
                            ))
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
