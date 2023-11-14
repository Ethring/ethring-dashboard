<template>
    <div class="tokens" :class="{ empty: isEmpty }">
        <template v-if="tokensData.length > 0">
            <div class="tokens__group" data-qa="tokens_group">
                <AssetItemHeader
                    v-if="tokensData.length"
                    title="Tokens"
                    :value="getAssetsShare(assetsTotalBalances)"
                    :totalBalance="assetsTotalBalances"
                />
                <AssetItemSubHeader type="Asset" />
                <AssetsTable :data="tokensData" />
            </div>
        </template>

        <template v-if="allIntegrations.length > 0">
            <div class="tokens__group" data-qa="protocol_group" v-for="(item, i) in integrationAssetsByPlatform" :key="i">
                <AssetItemHeader
                    v-if="item.data.length"
                    :logoURI="item.logoURI"
                    :title="item.platform"
                    :value="getAssetsShare(item.totalGroupBalance)"
                    :totalBalance="item.totalGroupBalance"
                    :showRewards="item.totalRewardsBalance > 0"
                    :reward="item.totalRewardsBalance"
                    :healthRate="item.healthRate"
                />
                <div v-for="(groupItem, n) in item.data" :key="n">
                    <AssetItemSubHeader :type="getFormattedName(groupItem.type)" :name="groupItem?.validator?.name" />
                    <AssetsTable :data="groupItem.balances" />
                </div>
            </div>
        </template>

        <template v-if="isEmpty">
            <EmptyList :title="$t('dashboard.emptyAssets')" />
        </template>

        <template v-if="isAllTokensLoading">
            <div v-for="(_, ndx) in 3" :key="ndx" class="tokens__group">
                <a-skeleton active avatar :paragraph="{ rows: 0 }" :style="{ paddingTop: '15px' }" />
            </div>
        </template>
    </div>
</template>
<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import useAdapter from '@/Adapter/compositions/useAdapter';

import EmptyList from '@/components/ui/EmptyList';

import AssetItemHeader from './assets/AssetItemHeader';
import AssetItemSubHeader from './assets/AssetItemSubHeader';
import AssetsTable from './assets/AssetsTable';

import { getIntegrationsGroupedByPlatform, getFormattedName } from '@/shared/utils/assets';

export default {
    name: 'Tokens',
    components: {
        AssetItemSubHeader,
        AssetItemHeader,
        AssetsTable,
        EmptyList,
    },
    setup() {
        const store = useStore();

        const { walletAccount, currentChainInfo } = useAdapter();

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const allTokens = computed(() => store.getters['tokens/tokens'][walletAccount.value] || []);
        const allIntegrations = computed(() => store.getters['tokens/integrations'][walletAccount.value] || []);

        const totalBalances = computed(() => store.getters['tokens/totalBalances'][walletAccount.value] || 0);
        const assetsTotalBalances = computed(() => store.getters['tokens/assetsBalances'][walletAccount.value] || 0);

        const isEmpty = computed(() => {
            return !allTokens.value?.length && !allIntegrations.value?.length && !isLoadingForChain.value && !isAllTokensLoading.value;
        });

        const integrationAssetsByPlatform = ref(getIntegrationsGroupedByPlatform(allIntegrations.value));
        // TODO: data should be reactive
        const tokensData = ref([...allTokens.value]);

        const getAssetsShare = (balance) => {
            if (!balance || !totalBalances.value) {
                return 0;
            }

            const share = BigNumber(balance).dividedBy(totalBalances.value).multipliedBy(100);

            return share.toNumber();
        };

        watch(isAllTokensLoading, () => {
            if (!isAllTokensLoading.value) {
                integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
                tokensData.value = [...allTokens.value];
            }
        });

        watch(walletAccount, () => {
            integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
            tokensData.value = [...allTokens.value];
        });

        watch(isLoadingForChain, () => {
            if (!isLoadingForChain.value) {
                integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
                tokensData.value = [...allTokens.value];
            }
        });

        return {
            tokensData,
            isLoadingForChain,
            isAllTokensLoading,

            isEmpty,

            allTokens,
            allIntegrations,

            assetsTotalBalances,
            integrationAssetsByPlatform,

            // utils for Assets templates
            getAssetsShare,
            getFormattedName,
        };
    },
};
</script>
<style lang="scss" scoped>
.tokens {
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    padding-bottom: 24px;
    border-radius: 16px;

    &__group {
        border: 1px solid var(--#{$prefix}border-color);
        background-color: var(--#{$prefix}secondary-background);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 16px;
        box-sizing: border-box;
        @include animateEasy;

        &.hide {
            height: 74px;
            min-height: 74px;
            overflow: hidden;
        }
    }

    &.empty {
        justify-content: center;
    }
}
</style>
