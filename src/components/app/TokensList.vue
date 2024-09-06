<template>
    <div class="assets-section">
        <a-collapse v-model:activeKey="collapseActiveKey" expand-icon-position="end" class="assets-block" ghost :bordered="false">
            <a-collapse-panel key="assets" class="assets-block-panel" data-qa="assets-panel" :show-arrow="false" collapsible="disabled">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="Tokens"
                        icon="TokensIcon"
                        :total-balance="assetsForAccount.totalBalance || 0"
                    />
                </template>

                <AssetsTable type="Asset" :data="assetsForAccount.list" :columns="ASSETS_COLUMNS" />

                <div v-if="assetsForAccount.total > assetsForAccount.list.length" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleAssetLoadMore" />
                </div>
            </a-collapse-panel>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, onMounted, watch, onUnmounted, shallowRef } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';

import AssetsTable from '@/components/app/assets/AssetsTable.vue';
import AssetGroupHeader from '@/components/app/assets/AssetGroupHeader.vue';
import UiButton from '@/components/ui/Button.vue';

export default {
    name: 'TokensList',
    components: {
        AssetGroupHeader,
        AssetsTable,
        UiButton,
    },
    setup() {
        const store = useStore();
        const balancesDB = new BalancesDB(1);
        const { walletAccount } = useAdapter();

        const collapseActiveKey = ref(['assets']);

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);
        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const assetIndex = computed(() => store.getters['tokens/assetIndex']);
        const loadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));

        // *********************************************************************************
        // * Assets from IndexedDB
        // * ShallowRef is used to avoid reactivity issues
        // * Data is updated by the watch function
        // * This is done to avoid reactivity issues with the IndexedDB
        // *********************************************************************************

        const assetsForAccount = shallowRef({
            list: [],
            total: 0,
            totalBalance: 0,
        });

        // *********************************************************************************
        // * Request to IndexedDB
        // *********************************************************************************

        const getAssetsForAccount = async () => {
            try {
                const response = await balancesDB.getAssetsForAccount(walletAccount.value, minBalance.value, {
                    assetIndex: assetIndex.value,
                });
                assetsForAccount.value = response;
            } catch (error) {
                console.error('Error getting assets for account', error);
            }
        };

        const makeRequest = async () => {
            try {
                await getAssetsForAccount();
            } catch (error) {
                console.error('Error requesting assets', error);
            }
        };

        // *********************************************************************************
        // * Load more Assets
        // *********************************************************************************

        const handleAssetLoadMore = () => store.dispatch('tokens/loadMoreAssets');

        // *********************************************************************************
        // * Watcher's handler
        // *********************************************************************************

        const handleOnChangeKeysToRequest = async ([account, minBalance, assetIndex, loading]) => {
            // ! If loading, do not request
            if (loading) return;
            await makeRequest();
        };

        // *********************************************************************************
        // * OnMounted
        // *********************************************************************************

        onMounted(async () => {
            store.dispatch('tokens/resetIndexes');
            store.dispatch('tokens/loadMoreAssets');

            await makeRequest();
        });

        // *********************************************************************************
        // * Watchers
        // *********************************************************************************

        const unWatchKeysToRequest = watch([targetAccount, minBalance, assetIndex, loadingByAccount], handleOnChangeKeysToRequest, {
            immediate: true,
        });

        // *********************************************************************************
        // * OnUnmounted
        // *********************************************************************************

        onUnmounted(() => {
            unWatchKeysToRequest();

            // * Reset indexes
            store.dispatch('tokens/resetIndexes');

            // ! Close the IndexedDB connection
            // balancesDB.close();
        });

        const ASSETS_COLUMNS = [
            {
                title: 'Asset',
                dataIndex: 'name',
                key: 'name',
                width: '55%',
                align: 'left',
                name: 'name',
            },
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
        ];

        return {
            collapseActiveKey,
            // * Assets from IndexedDB

            assetsForAccount,

            handleAssetLoadMore,

            // * Columns for the table
            ASSETS_COLUMNS,
        };
    },
};
</script>
