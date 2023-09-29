<template>
    <div class="select-token">
        <div class="select-token__page">
            <SelectToken :tokens="allTokens" :tokens-loading="isTokensLoading" @setToken="setToken" />
        </div>
    </div>
</template>
<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import useTokensList from '@/compositions/useTokensList';

import SelectToken from '@/components/ui/SelectToken.vue';

import PricesModule from '@/modules/prices/';
import { TOKEN_SELECT_TYPES, DIRECTIONS } from '@/shared/constants/operations';

export default {
    name: 'SearchSelectToken',
    components: {
        SelectToken,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const isTokensLoading = computed(() => store.getters['tokens/loader']);

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

        const fromToken = computed(() => {
            const isSrc = direction.value === DIRECTIONS.SOURCE;

            return isSrc ? selectedTokenFrom.value : selectedTokenTo.value;
        });

        const toToken = computed(() => {
            const isSrc = direction.value === DIRECTIONS.SOURCE;

            return isSrc ? selectedTokenTo.value : selectedTokenFrom.value;
        });

        const selectedNetwork = computed(() => {
            const isSrc = direction.value === DIRECTIONS.SOURCE;

            return isSrc ? selectedSrcNetwork.value : selectedDstNetwork.value;
        });

        // =================================================================================================================

        const { allTokensList } = useTokensList({
            network: selectedNetwork.value,
            fromToken: fromToken.value,
            toToken: toToken.value,
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
            if (!item.price) {
                const { chain_id, chainId } = selectedNetwork.value || {};

                const requestPriceFor = {
                    chainId: chain_id || chainId,
                    addresses: item.address,
                };

                const price = await PricesModule.Coingecko.priceByPlatformContracts(requestPriceFor);

                item.price = price[item.address]?.usd;
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
            isTokensLoading,

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
    @include pageStructure;
    &__page {
        @include pageFlexColumn;
        height: calc(100vh - 125px);
        position: relative;
    }
}
</style>
