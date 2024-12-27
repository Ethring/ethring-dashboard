<template>
    <div class="dashboard">
        <a-typography-title class="dashboard__title">Dashboard</a-typography-title>

        <a-row :gutter="16" class="dashboard__stats-row">
            <a-col :span="12">
                <StatisticalCard title="Portfolio Value" :value="0" :precision="2" prefix="$" />
            </a-col>
            <a-col :span="12">
                <StatisticalCard title="Average APR" :value="0" :precision="2" suffix="%" class="demo-class" />
            </a-col>
        </a-row>

        <AssetTable type="asset" :columns="columns" :data="assets" :loading="isLoadingBalances" style="margin-top: 30px" />
    </div>
</template>
<script>
import { ref, onMounted, computed, shallowRef, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import StatisticalCard from '@/components/ui/StatisticalCard/index.vue';
import AssetTable from '@/components/ui/AssetTable/AssetTable.vue';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';

export default {
    name: 'Dashboard',
    components: {
        AssetTable,
        StatisticalCard,
    },
    setup() {
        const activeRadio = ref('assets');

        const store = useStore();
        const isMounted = ref(false);
        const { walletAccount } = useAdapter();

        const COLUMNS = [
            {
                title: 'Asset',
                dataIndex: 'asset',
                key: 'asset',
                sorter: true,
                sorter: (prev, next) => prev.name.localeCompare(next.name),
            },
            {
                title: 'Protocol',
                dataIndex: 'protocol',
                key: 'protocol',
                sorter: true,
            },
            {
                title: 'Chains',
                dataIndex: 'chains',
                key: 'chains',
            },
            {
                title: 'Value',
                dataIndex: 'balanceUsd',
                key: 'balanceUsd',
                sorter: (prev, next) => prev.balanceUsd - next.balanceUsd,
            },
            {
                title: 'APY',
                dataIndex: 'apy',
                key: 'apy',
            },
            {
                title: 'Actions',
                dataIndex: 'actions',
            },
        ];

        const radioOptions = [
            { key: 'Assets', value: 'assets' },
            { key: 'DeFi', value: 'defi' },
        ];

        const isLoadingBalances = computed(() =>
            walletAccount.value ? store.getters['tokens/loadingByAccount'](walletAccount.value) : false,
        );

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);
        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const assetIndex = computed(() => store.getters['tokens/assetIndex']);
        const isNeedToLoadFromIndexedDB = computed(() => store.getters['tokens/isNeedToLoadFromIndexedDB'](targetAccount.value));

        const assets = computed(() => store.getters['configs/getStakeTokens']);

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
            if (!walletAccount.value) return;

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
        const handleOnChangeKeysToRequest = async (
            [account, minBalance, assetIndex, isNeedToLoadFromIndexedDB],
            [oldAccount, oldMinBalance, oldAssetIndex, oldIsNeedToLoadFromIndexedDB],
        ) => {
            if (isNeedToLoadFromIndexedDB) return await makeRequest();

            return await makeRequest();
        };

        // *********************************************************************************
        // * OnMounted
        // *********************************************************************************

        onMounted(async () => {
            isMounted.value = true;
            await makeRequest();
            console.log('Dashboard mounted', assets.value);
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

        return {
            isLoadingBalances,
            assets,

            // * Assets from IndexedDB
            assetsForAccount,

            // * Columns for the table
            columns: COLUMNS,

            radioOptions,
            activeRadio,
        };
    },
};
</script>
