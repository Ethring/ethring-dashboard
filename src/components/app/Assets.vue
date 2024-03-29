<template>
    <div class="assets-section">
        <a-collapse v-model:activeKey="collapseActiveKey" expand-icon-position="end" class="assets-block" ghost :bordered="false">
            <a-collapse-panel key="assets" class="assets-block-panel" data-qa="assets-panel">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="Tokens"
                        icon="TokensIcon"
                        :value="getAssetsShare(totalAssetsBalances)"
                        :totalBalance="totalAssetsBalances || 0"
                    />
                </template>

                <AssetsTable
                    type="Asset"
                    :data="allTokensInAccount"
                    :columns="[DEFAULT_NAME_COLUMN, ...DEFAULT_COLUMNS]"
                    :loading="isLoadingByAccount || isLoadingForChain"
                />
            </a-collapse-panel>

            <a-collapse-panel
                v-show="isAllTokensLoading || allIntegrationsByPlatforms.length > 0"
                v-for="item in allIntegrationsByPlatforms"
                :key="item.platform"
                class="assets-block-panel"
                @vue:mounted="collapseActiveKey.push(item.platform)"
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

            <a-collapse-panel class="assets-block-panel" key="nfts" v-show="isAllTokensLoading || allNFTsByCollection.length > 0">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="NFT Gallery"
                        :totalBalance="totalNftBalances"
                        icon="NftsIcon"
                    />
                </template>

                <AssetsTable :data="allNFTsByCollection" type="NFTS" :columns="NFT_COLUMNS" :loading="allNFTsByCollection.length <= 0" />
            </a-collapse-panel>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';

import BigNumber from 'bignumber.js';

import AssetsTable from './assets/AssetsTable';
import AssetGroupHeader from './assets/AssetGroupHeader';

import { getFormattedName } from '@/shared/utils/assets';

export default {
    name: 'Assets',
    components: {
        AssetGroupHeader,
        AssetsTable,
    },
    setup() {
        const store = useStore();

        // TODO: collapse active key by step
        const collapseActiveKey = ref([]);

        const useAdapter = inject('useAdapter');

        const { walletAccount, currentChainInfo } = useAdapter();

        const keyPressCombination = ref('');

        const collapsedAssets = computed(() => store.getters['app/collapsedAssets']);

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](targetAccount.value, currentChainInfo.value?.net));

        const isLoadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));
        // const loadingsByChains = computed(() => store.getters['tokens/loadingForChains'](targetAccount.value));

        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        // TODO: add bundling
        // ===================== Balances =====================
        const allTokensInAccount = computed(() => store.getters['tokens/getAccountBalanceByType'](targetAccount.value, 'tokens') || []);
        // ===================== Integrations =====================
        const allIntegrationsByPlatforms = computed(() => store.getters['tokens/getIntegrationsByPlatforms'](targetAccount.value));
        // ===================== NFTs =====================
        const allNFTsByCollection = computed(() => store.getters['tokens/getNFTsByCollection'](targetAccount.value) || []);

        // ===================== Total Balances =====================
        const totalBalances = computed(() => store.getters['tokens/getTotalBalanceByType'](targetAccount.value, 'totalBalances') || 0);
        const totalAssetsBalances = computed(
            () => store.getters['tokens/getTotalBalanceByType'](targetAccount.value, 'assetsBalances') || 0
        );

        const isEmpty = computed(() => {
            return (
                !allTokensInAccount.value?.length &&
                !allIntegrationsByPlatforms.value?.length &&
                !isLoadingForChain.value &&
                !isAllTokensLoading.value
            );
        });

        const totalNftBalances = computed(() => {
            if (!allNFTsByCollection.value.length) {
                return 0;
            }

            const totalSum = allNFTsByCollection.value.reduce((totalBalance, collection) => {
                return totalBalance.plus(+collection.totalGroupBalance || 0);
            }, BigNumber(0));

            return totalSum.toNumber();
        });

        const allCollapsedActiveKeys = computed(() => {
            if (!allIntegrationsByPlatforms.value.length) {
                return ['assets'];
            }

            const keys = ['assets', 'nfts'];

            allIntegrationsByPlatforms.value.map((item) => {
                keys.push(item.platform);
            });

            return keys;
        });

        const getAssetsShare = (balance) => {
            if (!balance || !totalBalances.value) {
                return 0;
            }

            const share = BigNumber(balance).dividedBy(totalBalances.value).multipliedBy(100);

            return share.toNumber();
        };

        const handleKeyDown = async (e) => {
            const requiredCombination = 'all';
            const requiredKeys = ['a', 'l'];

            if (!requiredKeys.includes(e.key)) {
                return (keyPressCombination.value = '');
            }

            if (requiredKeys.includes(e.key)) {
                keyPressCombination.value += e.key;
            }

            if (!keyPressCombination.value.startsWith('a')) {
                return (keyPressCombination.value = '');
            }

            if (keyPressCombination.value === requiredCombination) {
                const bundleAcc = targetAccount.value === 'all' ? walletAccount.value : 'all';

                await store.dispatch('tokens/setTargetAccount', bundleAcc);

                const isBundled = bundleAcc === 'all';

                message.info(`[DEBUG] Bundling ${isBundled ? 'enabled' : 'disabled'}`);

                return (keyPressCombination.value = '');
            }
        };

        const updateCollapsedAssets = () => {
            if (allCollapsedActiveKeys.value.length && allIntegrationsByPlatforms.value.length) {
                const list = allCollapsedActiveKeys.value.filter((key) => !collapsedAssets.value.includes(key));

                collapseActiveKey.value = collapsedAssets.value ? list : allCollapsedActiveKeys.value;
            } else if (!collapsedAssets.value.length) {
                collapseActiveKey.value = allCollapsedActiveKeys.value;
            }
        };

        onMounted(async () => {
            window.addEventListener('keydown', handleKeyDown);
            keyPressCombination.value = '';

            await Promise.all([allCollapsedActiveKeys.value, allIntegrationsByPlatforms.value]);

            updateCollapsedAssets();
        });

        onBeforeUnmount(() => {
            window.removeEventListener('keydown', handleKeyDown);
            keyPressCombination.value = '';
        });

        watch(collapseActiveKey, () => {
            const hiddenKeys = allCollapsedActiveKeys.value.filter((key) => !collapseActiveKey.value.includes(key));
            store.dispatch('app/setCollapsedAssets', hiddenKeys);
        });

        watch(walletAccount, () => {
            store.dispatch('app/setCollapsedAssets', []);
        });

        watch(allIntegrationsByPlatforms, () => {
            updateCollapsedAssets();
        });

        return {
            isLoadingForChain,
            isLoadingByAccount,
            isAllTokensLoading,

            isEmpty,

            allTokensInAccount,

            allIntegrationsByPlatforms,
            allNFTsByCollection,

            totalAssetsBalances,
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
