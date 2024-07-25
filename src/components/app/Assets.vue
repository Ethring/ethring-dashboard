<template>
    <div class="assets-section">
        <a-collapse
            v-model:activeKey="collapseActiveKey"
            expand-icon-position="end"
            class="assets-block"
            ghost
            :bordered="false"
            @change="handleOnChangeActiveKey"
        >
            <template #expandIcon>
                <ArrowDownIcon class="arrow" />
            </template>

            <a-collapse-panel key="assets" class="assets-block-panel" data-qa="assets-panel">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="Tokens"
                        icon="TokensIcon"
                        :value="getAssetsShare(totalAssetsBalances)"
                        :total-balance="totalAssetsBalances || 0"
                    />
                </template>

                <AssetsTable
                    type="Asset"
                    :data="visibleAssets"
                    :columns="[DEFAULT_NAME_COLUMN, ...DEFAULT_COLUMNS]"
                    :loading="isLoadingByAccount || isLoadingForChain"
                />

                <div v-if="totalAssets > visibleAssets.length" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleAssetLoadMore" />
                </div>
            </a-collapse-panel>

            <a-collapse-panel
                v-for="item in allIntegrationsByPlatforms"
                v-show="isAllTokensLoading || allIntegrationsByPlatforms.length > 0"
                :key="item.platform"
                class="assets-block-panel"
                @vue:mounted="updateCollapsedKey(item)"
            >
                <template #header>
                    <AssetGroupHeader
                        v-if="item.platform"
                        class="assets-section__group-header"
                        :logo-u-r-i="item.logoURI"
                        :title="item.platform"
                        :value="getAssetsShare(item.totalGroupBalance)"
                        :total-balance="item.totalGroupBalance"
                        :show-rewards="item.totalRewardsBalance > 0"
                        :reward="item.totalRewardsBalance"
                        :health-rate="item.healthRate"
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

            <a-collapse-panel v-show="isAllTokensLoading || totalNFTs > 0" key="nfts" class="assets-block-panel">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="NFT Gallery"
                        :total-balance="totalNftBalances"
                        icon="NftsIcon"
                    />
                </template>

                <AssetsTable :data="visibleNFTs" type="NFTS" :columns="NFT_COLUMNS" :loading="totalNFTs <= 0" />

                <div v-if="totalNFTs > visibleNFTs.length" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleNFTsLoadMore" />
                </div>
            </a-collapse-panel>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';

import BigNumber from 'bignumber.js';

import AssetsTable from './assets/AssetsTable';
import AssetGroupHeader from './assets/AssetGroupHeader';

import UiButton from '@/components/ui/Button.vue';

import ArrowDownIcon from '@/assets/icons/form-icons/arrow-down.svg';

import { getFormattedName } from '@/shared/utils/assets';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

export default {
    name: 'Assets',
    components: {
        AssetGroupHeader,
        AssetsTable,
        UiButton,

        ArrowDownIcon,
    },
    setup() {
        const store = useStore();

        const collapseActiveKey = ref([]);
        const keyPressCombination = ref('');

        const { walletAccount, currentChainInfo } = useAdapter();

        const collapsedAssets = computed(() => store.getters['app/collapsedAssets']);
        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](targetAccount.value, currentChainInfo.value?.net));
        const isLoadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        // *********************************************************************************
        // ****************************** Assets *******************************************
        // *********************************************************************************

        const getAccountBalanceByType = (type) => {
            switch (type) {
                case 'tokens':
                    return store.getters['tokens/getAccountBalanceByType'](targetAccount.value, 'tokens') || [];
                case 'integrations':
                    return store.getters['tokens/getIntegrationsByPlatforms'](targetAccount.value) || [];
                case 'nfts':
                    return store.getters['tokens/getNFTsByCollection'](targetAccount.value) || [];
                default:
                    return [];
            }
        };

        const totalAssets = computed(() => store.getters['tokens/getCountOfBalances'](targetAccount.value, 'tokens'));
        const totalNFTs = computed(() => store.getters['tokens/getCountOfBalances'](targetAccount.value, 'nfts'));

        const visibleAssets = computed(() => store.getters['tokens/getVisibleAssets'](targetAccount.value));
        const visibleNFTs = computed(() => store.getters['tokens/getVisibleNFTs'](targetAccount.value));

        const allIntegrationsByPlatforms = computed(() => getAccountBalanceByType('integrations'));
        const allNFTsByCollection = computed(() => getAccountBalanceByType('nfts'));

        // *********************************************************************************
        // ****************************** Total Balances ************************************
        // *********************************************************************************

        const getTotalBalanceByType = (type) => {
            switch (type) {
                case 'nftsBalances':
                    return store.getters['tokens/getTotalBalanceOfNFTs'](targetAccount.value) || 0;
                default:
                    return store.getters['tokens/getTotalBalanceByType'](targetAccount.value, type) || 0;
            }
        };

        const totalBalances = computed(() => getTotalBalanceByType('totalBalances'));
        const totalAssetsBalances = computed(() => getTotalBalanceByType('assetsBalances'));
        const totalNftBalances = computed(() => getTotalBalanceByType('nftsBalances'));

        const isEmpty = computed(
            () => !totalAssets.value && !allIntegrationsByPlatforms.value?.length && !isLoadingForChain.value && !isAllTokensLoading.value,
        );

        const allCollapsedActiveKeys = computed(() => {
            const keys = ['assets', 'nfts'];

            if (allIntegrationsByPlatforms.value.length) allIntegrationsByPlatforms.value.forEach((item) => keys.push(item.platform));

            return keys;
        });

        const getAssetsShare = (balance) => {
            if (!balance || !totalBalances.value) return 0;
            return BigNumber(balance).dividedBy(totalBalances.value).multipliedBy(100).toNumber();
        };

        const handleKeyDown = async (e) => {
            const requiredCombination = 'all';
            const requiredKeys = ['a', 'l'];

            if (!requiredKeys.includes(e.key)) return (keyPressCombination.value = '');

            if (requiredKeys.includes(e.key)) keyPressCombination.value += e.key;

            if (!keyPressCombination.value.startsWith('a')) return (keyPressCombination.value = '');

            if (keyPressCombination.value === requiredCombination) {
                const bundleAcc = targetAccount.value === 'all' ? walletAccount.value : 'all';

                await store.dispatch('tokens/setTargetAccount', bundleAcc);

                const isBundled = bundleAcc === 'all';

                message.info(`[DEBUG] Bundling ${isBundled ? 'enabled' : 'disabled'}`);

                return (keyPressCombination.value = '');
            }
        };

        const updateCollapsedAssets = () => {
            if (!collapsedAssets.value.length) collapseActiveKey.value = allCollapsedActiveKeys.value;
            collapseActiveKey.value = allCollapsedActiveKeys.value.filter((key) => !collapsedAssets.value.includes(key));
        };

        const updateCollapsedKey = (item) => {
            if (!collapsedAssets.value.includes(item.platform)) collapseActiveKey.value.push(item.platform);
        };

        const handleNFTsLoadMore = async () => await store.dispatch('tokens/loadMoreNFTs');
        const handleAssetLoadMore = async () => await store.dispatch('tokens/loadMoreAssets');

        const handleOnChangeAccount = async (account, oldAccount) => {
            if (account === oldAccount) return;
            if (account) {
                await store.dispatch('app/setCollapsedAssets', []);
                await store.dispatch('tokens/resetIndexes');
            }
        };

        const handleOnChangeActiveKey = async (keys) => {
            if (!keys.includes('assets')) await store.dispatch('tokens/resetIndexes', { resetAssets: true, resetNFTs: false });
            if (!keys.includes('nfts')) await store.dispatch('tokens/resetIndexes', { resetAssets: false, resetNFTs: true });

            await store.dispatch(
                'app/setCollapsedAssets',
                allCollapsedActiveKeys.value.filter((key) => !collapseActiveKey.value.includes(key)),
            );
        };

        onMounted(async () => {
            window.addEventListener('keydown', handleKeyDown);
            keyPressCombination.value = '';

            updateCollapsedAssets();

            await store.dispatch('tokens/resetIndexes');
        });

        onBeforeUnmount(async () => {
            window.removeEventListener('keydown', handleKeyDown);
            keyPressCombination.value = '';

            updateCollapsedAssets();
            await store.dispatch('tokens/resetIndexes');
        });

        // watch(collapseActiveKey, async () => {
        //     console.log('collapseActiveKey', collapseActiveKey.value);
        //     await store.dispatch(
        //         'app/setCollapsedAssets',
        //         allCollapsedActiveKeys.value.filter((key) => !collapseActiveKey.value.includes(key)),
        //     );
        // });

        watch(walletAccount, async (account, oldAccount) => await handleOnChangeAccount(account, oldAccount));

        return {
            isLoadingForChain,
            isLoadingByAccount,
            isAllTokensLoading,

            isEmpty,

            allIntegrationsByPlatforms,
            allNFTsByCollection,

            totalAssetsBalances,
            totalNftBalances,

            // utils for Assets templates
            getAssetsShare,
            getFormattedName,

            collapseActiveKey,
            updateCollapsedKey,

            handleOnChangeActiveKey,

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

            handleNFTsLoadMore,
            handleAssetLoadMore,

            visibleNFTs,
            totalNFTs,

            visibleAssets,
            totalAssets,
        };
    },
};
</script>
