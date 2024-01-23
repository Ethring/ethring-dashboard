<template>
    <div class="assets-section">
        <a-collapse v-model:activeKey="collapseActiveKey" expand-icon-position="end" class="assets-block" ghost :bordered="false">
            <a-collapse-panel key="assets" class="assets-block-panel">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="Tokens"
                        icon="TokensIcon"
                        :value="getAssetsShare(assetsTotalBalances)"
                        :totalBalance="assetsTotalBalances"
                    />
                </template>

                <AssetsTable
                    type="Asset"
                    :data="allTokensInAccount"
                    :columns="[DEFAULT_NAME_COLUMN, ...DEFAULT_COLUMNS]"
                    :loading="isLoadingForChain"
                />
            </a-collapse-panel>

            <a-collapse-panel
                v-show="isAllTokensLoading || integrationAssetsByPlatform.length > 0"
                v-for="(item, i) in integrationAssetsByPlatform"
                :key="`protocol-${i}`"
                class="assets-block-panel"
            >
                <template #header>
                    <AssetGroupHeader
                        v-if="item.platform"
                        class="assets-section__group-header"
                        :logoURI="item.logoURI"
                        :title="item.platform"
                        :value="getAssetsShare(item.totalGroupBalance)"
                        :totalBalance="item.totalGroupBalance"
                        :showRewards="item.totalRewardsBalance > 0"
                        :reward="item.totalRewardsBalance"
                        :healthRate="item.healthRate"
                    />
                </template>

                <AssetsTable
                    v-for="(groupItem, n) in item.data"
                    :key="n"
                    class="protocols-table"
                    :data="groupItem.balances"
                    :columns="[{ ...DEFAULT_NAME_COLUMN, title: groupItem?.name }, ...DEFAULT_COLUMNS]"
                    :type="getFormattedName(groupItem.type)"
                    :name="groupItem?.validator?.name"
                />
            </a-collapse-panel>

            <a-collapse-panel class="assets-block-panel" key="nfts" v-show="isAllTokensLoading || nftsByCollection.length > 0">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="NFT Gallery"
                        :totalBalance="totalNftBalances"
                        icon="NftsIcon"
                    />
                </template>

                <AssetsTable :data="nftsByCollection" type="NFTS" :columns="NFT_COLUMNS" :loading="nftsByCollection.length <= 0" />
            </a-collapse-panel>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, watch, watchEffect, inject } from 'vue';
import { useStore } from 'vuex';

import BigNumber from 'bignumber.js';

import AssetGroupHeader from './assets/AssetGroupHeader';
import AssetsTable from './assets/AssetsTable';
// import AssetsNftTable from './assets/AssetsNftTable';

import { getIntegrationsGroupedByPlatform, getFormattedName, getNftsByCollection } from '@/shared/utils/assets';

export default {
    name: 'Assets',
    components: {
        AssetGroupHeader,
        AssetsTable,
        // AssetsNftTable,
    },
    setup() {
        const store = useStore();
        const collapseActiveKey = ref([
            'assets',
            'nfts',
            'protocol-0',
            'protocol-1',
            'protocol-2',
            'protocol-3',
            'protocol-4',
            'protocol-5',
            'protocol-6',
            'protocol-7',
            'protocol-8',
            'protocol-9',
            'protocol-10',
        ]);

        const useAdapter = inject('useAdapter');

        const { walletAccount, currentChainInfo } = useAdapter();

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](currentChainInfo.value?.net));
        const loadingForChains = computed(() => store.getters['tokens/loadingForChains']);
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const allTokensInAccount = computed(() => store.getters['tokens/tokens'][walletAccount.value] || []);
        const allIntegrations = computed(() => store.getters['tokens/integrations'][walletAccount.value] || []);
        const allNfts = computed(() => store.getters['tokens/nfts'][walletAccount.value] || []);

        const totalBalances = computed(() => store.getters['tokens/totalBalances'][walletAccount.value] || 0);
        const assetsTotalBalances = computed(() => store.getters['tokens/assetsBalances'][walletAccount.value] || 0);

        const isEmpty = computed(() => {
            return (
                !allTokensInAccount.value?.length && !allIntegrations.value?.length && !isLoadingForChain.value && !isAllTokensLoading.value
            );
        });

        const integrationAssetsByPlatform = ref(getIntegrationsGroupedByPlatform(allIntegrations.value));

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
        };

        watch(isAllTokensLoading, () => {
            if (!isAllTokensLoading.value) {
                updateAssets();
            }
        });

        watch(walletAccount, () => {
            updateAssets();
        });

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
            isLoadingForChain,
            isLoadingForChains: loadingForChains,
            isAllTokensLoading,

            isEmpty,

            allTokensInAccount,
            allIntegrations,

            assetsTotalBalances,
            integrationAssetsByPlatform,
            nftsByCollection,
            totalNftBalances,

            // utils for Assets templates
            getAssetsShare,
            getFormattedName,

            collapseActiveKey,

            // ===================== Columns =====================

            DEFAULT_NAME_COLUMN: {
                title: 'Asset',
                dataIndex: 'name',
                key: 'name',
                width: '55%',
                align: 'left',
                name: 'name',
            },

            DEFAULT_COLUMNS: [
                {
                    title: 'Balance',
                    dataIndex: 'balance',
                    key: 'balance',
                    width: '20%',
                    align: 'left',
                },
                {
                    title: 'Value',
                    dataIndex: 'balanceUsd',
                    key: 'balanceUsd',
                    width: '20%',
                    align: 'right',
                    defaultSortOrder: 'descend',
                    sorter: (a, b) => a.balanceUsd - b.balanceUsd,
                },
            ],

            NFT_COLUMNS: [
                {
                    title: 'Collection name',
                    dataIndex: 'name',
                    key: 'name',
                    width: '55%',
                    align: 'left',
                    name: 'name',
                },
                {
                    title: 'Holdings',
                    dataIndex: 'totalGroupBalance',
                    key: 'totalGroupBalance',
                    width: '20%',
                    align: 'left',
                },
                {
                    title: 'Floor price (24h)',
                    dataIndex: 'floorPriceUsd',
                    key: 'floorPriceUsd',
                    width: '20%',
                    align: 'right',
                    defaultSortOrder: 'descend',
                    sorter: (a, b) => a.floorPriceUsd - b.floorPriceUsd,
                },
            ],
        };
    },
};
</script>
