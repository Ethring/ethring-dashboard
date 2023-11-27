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

        const getPriceByCoingeckoId = async (coingeckoId) => {
            try {
                const priceById = await PricesModule.Coingecko.marketCapForNativeCoin(coingeckoId);
                const { usd = null } = priceById || {};

                if (!usd) {
                    return 0;
                }

                const { price = 0 } = usd || {};

                return price;
            } catch (error) {
                console.warn('error while requesting price from Coingecko', error);
                return 0;
            }
        };

        const getPriceFromProvider = async (tokenAddress, { coingeckoId = null } = {}) => {
            const { chain_id, chainId } = selectedNetwork.value || {};

            const requestPriceFor = {
                chainId: chain_id || chainId,
                addresses: tokenAddress,
            };

            if (coingeckoId) {
                return await getPriceByCoingeckoId(coingeckoId);
            }

            try {
                const price = await PricesModule.Coingecko.priceByPlatformContracts(requestPriceFor);
                const address = tokenAddress?.toLowerCase() || tokenAddress;

                if (!price[address]) {
                    return 0;
                }

                const { usd = 0 } = price[address] || {};

                return usd;
            } catch (error) {
                console.warn('error while requesting price from Coingecko', error);
                return 0;
            }
        };

        const setToken = async (item) => {
            if (!item.price) {
                item.price = await getPriceFromProvider(item.address, { coingeckoId: item.coingecko_id });
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
