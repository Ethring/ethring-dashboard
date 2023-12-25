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

        <template v-if="nftsByCollection.length > 0">
            <div class="tokens__group">
                <AssetItemHeader title="NFT" :totalBalance="totalNftBalances" />
                <AssetItemSubHeader
                    :type="$t('dashboard.nft.collectionName')"
                    :secondColumnType="$t('dashboard.nft.holdings')"
                    :thirdColumnType="$t('dashboard.nft.floorPrice')"
                />
                <AssetNftItem v-for="(collection, i) in nftsByCollection" :item="collection" :key="i" />
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
import { ref, computed, watch, watchEffect } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import useAdapter from '@/Adapter/compositions/useAdapter';

import EmptyList from '@/components/ui/EmptyList';

import AssetItemHeader from './assets/AssetItemHeader';
import AssetItemSubHeader from './assets/AssetItemSubHeader';
import AssetNftItem from './assets/AssetNftItem';
import AssetsTable from './assets/AssetsTable';

import { getIntegrationsGroupedByPlatform, getFormattedName, getNftsByCollection } from '@/shared/utils/assets';

export default {
    name: 'Assets',
    components: {
        AssetItemSubHeader,
        AssetItemHeader,
        AssetsTable,
        EmptyList,
        AssetNftItem,
    },
    setup() {
        const store = useStore();

        const { walletAccount, currentChainInfo } = useAdapter();

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));
        const loadingForChains = computed(() => store.getters['tokens/loadingForChains']);
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const allTokens = computed(() => store.getters['tokens/tokens'][walletAccount.value] || []);
        const allIntegrations = computed(() => store.getters['tokens/integrations'][walletAccount.value] || []);
        const allNfts = computed(() => store.getters['tokens/nfts'][walletAccount.value] || []);

        const totalBalances = computed(() => store.getters['tokens/totalBalances'][walletAccount.value] || 0);
        const assetsTotalBalances = computed(() => store.getters['tokens/assetsBalances'][walletAccount.value] || 0);

        const isEmpty = computed(() => {
            return !allTokens.value?.length && !allIntegrations.value?.length && !isLoadingForChain.value && !isAllTokensLoading.value;
        });

        const integrationAssetsByPlatform = ref(getIntegrationsGroupedByPlatform(allIntegrations.value));

        // TODO: data should be reactive
        const tokensData = ref([...allTokens.value]);

        const nftsByCollection = ref(getNftsByCollection(allNfts.value));

        const totalNftBalances = computed(() => {
            if (!nftsByCollection.value.length) {
                return 0;
            }

            const totalSum = nftsByCollection.value.reduce((totalBalance, collection) => {
                return totalBalance.plus(+collection.totalGroupBalance || 0);
            }, BigNumber(0));

            return totalSum.toNumber();
        });

        const getAssetsShare = (balance) => {
            if (!balance || !totalBalances.value) {
                return 0;
            }

            const share = BigNumber(balance).dividedBy(totalBalances.value).multipliedBy(100);

            return share.toNumber();
        };

        const updateAssets = () => {
            integrationAssetsByPlatform.value = getIntegrationsGroupedByPlatform(allIntegrations.value);
            nftsByCollection.value = getNftsByCollection(allNfts.value);
            tokensData.value = [...allTokens.value];
        };

        watch(isAllTokensLoading, () => {
            if (!isAllTokensLoading.value) {
                updateAssets();
            }
        });

        watch(walletAccount, () => updateAssets());

        watch(isLoadingForChain, () => {
            if (!isLoadingForChain.value) {
                updateAssets();
            }
        });

        watchEffect(() => {
            for (const chain in loadingForChains.value) {
                if (!loadingForChains.value[chain]) {
                    updateAssets();
                }
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
            nftsByCollection,
            totalNftBalances,

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
        border: 1px solid var(--#{$prefix}assets-border-color);
        background-color: var(--#{$prefix}secondary-background);
        border-radius: 16px;
        padding: 16px 16px 8px;
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
