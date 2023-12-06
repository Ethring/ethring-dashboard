<template>
    <div class="select-token">
        <div class="select-token__page">
            <SelectToken :tokens="allTokens" :tokens-loading="isTokensLoadingForChain" @setToken="setToken" />
        </div>
    </div>
</template>
<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import useTokensList from '@/compositions/useTokensList';

import SelectToken from '@/components/ui/SelectToken.vue';

import { getPriceFromProvider } from '@/shared/utils/prices';
import { TOKEN_SELECT_TYPES, DIRECTIONS, PRICE_UPDATE_TIME } from '@/shared/constants/operations';

export default {
    name: 'SearchSelectToken',
    components: {
        SelectToken,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        // =================================================================================================================

        const selectType = computed(() => store.getters['tokenOps/selectType']);
        const direction = computed(() => store.getters['tokenOps/direction']);

        // =================================================================================================================

        const selectedSrcNetwork = computed({
            get: () => store.getters['tokenOps/srcNetwork'],
            set: (value) => store.dispatch('tokenOps/setSrcNetwork', value),
        });

        const selectedDstNetwork = computed({
            get: () => store.getters['tokenOps/dstNetwork'],
            set: (value) => store.dispatch('tokenOps/setDstNetwork', value),
        });

        // =================================================================================================================

        const selectedTokenFrom = computed({
            get: () => store.getters['tokenOps/srcToken'],
            set: (value) => store.dispatch('tokenOps/setSrcToken', value),
        });

        const selectedTokenTo = computed({
            get: () => store.getters['tokenOps/dstToken'],
            set: (value) => store.dispatch('tokenOps/setDstToken', value),
        });

        // =================================================================================================================

        const selectedNetwork = computed(() => {
            const isSrc = direction.value === DIRECTIONS.SOURCE;

            return isSrc ? selectedSrcNetwork.value : selectedDstNetwork.value;
        });

        // =================================================================================================================

        const isTokensLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](selectedNetwork.value?.net));

        // =================================================================================================================

        const { allTokensList } = useTokensList({
            network: selectedNetwork.value,
            fromToken: selectedTokenFrom.value,
            toToken: selectedTokenTo.value,
        });

        // =================================================================================================================

        onMounted(() => {
            const { chain_id, chainId } = selectedNetwork.value || {};

            if (!chain_id && !chainId) {
                return router.push('/main');
            }
        });

        // =================================================================================================================

        const setToken = async (item) => {
            const isPriceUpdate = new Date().getTime() - item?.priceUpdatedAt > PRICE_UPDATE_TIME;

            if (!item.price || isPriceUpdate) {
                item.price = await getPriceFromProvider(item.address, selectedNetwork.value, { coingeckoId: item.coingecko_id });
                item.priceUpdatedAt = new Date().getTime();
            }

            if (!item.address && item.base) {
                item.address = item.base;
            }

            if (selectType.value === TOKEN_SELECT_TYPES.FROM) {
                selectedTokenFrom.value = item;
            }

            if (selectType.value === TOKEN_SELECT_TYPES.TO) {
                selectedTokenTo.value = item;
            }

            return router.push(router.options.history.state.back);
        };

        return {
            // loaders
            isTokensLoadingForChain,

            // computed values
            allTokens: allTokensList,

            // methods
            setToken,
        };
    },
};
</script>
<style lang="scss" scoped>
.select-token {
    &__page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);
        position: relative;
    }
}
</style>
