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
            </a-collapse-panel>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, onMounted, watch, onUnmounted, shallowRef, onDeactivated } from 'vue';
import { useStore } from 'vuex';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';

import AssetsTable from '@/components/app/assets/AssetsTable.vue';
import AssetGroupHeader from '@/components/app/assets/AssetGroupHeader.vue';

export default {
    name: 'TokensList',
    components: {
        AssetGroupHeader,
        AssetsTable,
    },
    setup() {
        const store = useStore();
        const isMounted = ref(false);
        const { walletAccount } = useAdapter();

        const collapseActiveKey = ref(['assets']);

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);
        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const assetIndex = computed(() => store.getters['tokens/assetIndex']);
        const isNeedToLoadFromIndexedDB = computed(() => store.getters['tokens/isNeedToLoadFromIndexedDB'](targetAccount.value));

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
                if (!isMounted.value) return console.log('Assets not mounted, skipping update');
                const response = await BalancesDB.getAssetsForAccount(walletAccount.value, minBalance.value, {
                    isAll: true,
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
        // * Watcher's handler
        // *********************************************************************************

        const handleOnChangeKeysToRequest = async ([account, minBalance, assetIndex, isNeedToLoadFromIndexedDB]) => {
            if (!isNeedToLoadFromIndexedDB) return;
            return await makeRequest();
        };

        // *********************************************************************************
        // * OnMounted
        // *********************************************************************************

        onMounted(async () => {
            isMounted.value = true;
            await makeRequest();
        });

        // *********************************************************************************
        // * Watchers
        // *********************************************************************************

        const unWatchKeysToRequest = watch([targetAccount, minBalance, assetIndex, isNeedToLoadFromIndexedDB], handleOnChangeKeysToRequest);

        // *********************************************************************************
        // * OnUnmounted
        // *********************************************************************************

        onUnmounted(() => {
            isMounted.value = false;
            unWatchKeysToRequest();

            // * Reset indexes
            store.dispatch('tokens/resetIndexes');
        });

        onDeactivated(() => {
            isMounted.value = false;
            unWatchKeysToRequest();

            // * Reset indexes
            store.dispatch('tokens/resetIndexes');
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

            // * Columns for the table
            ASSETS_COLUMNS,
        };
    },
};
</script>
