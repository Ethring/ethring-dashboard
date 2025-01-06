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

        <a-row>
            <a-col :span="24">
                <a-table
                    class="asset-table"
                    size="small"
                    :columns="columns"
                    :data-source="assets"
                    :pagination="false"
                    :bordered="false"
                    :loading="isLoadingBalances"
                    :scroll="{ x: 700 }"
                    :row-key="(record) => rowKey(record)"
                >
                    <template #bodyCell="{ column, record }">
                        <AssetRow v-if="record && column" :item="record" :column="column.dataIndex">
                            <template v-if="walletAccount" #actions>
                                <div
                                    class="asset-table__action"
                                    type="link"
                                    :class="{
                                        'asset-table__action--add': !isAlreadyExistInCart(record),
                                        'asset-table__action--remove': isAlreadyExistInCart(record),
                                    }"
                                    @click="() => onClickToAction(record)"
                                >
                                    <component :is="getActionTitle(record)" />
                                </div>
                            </template>
                        </AssetRow>
                    </template>
                </a-table>
            </a-col>
        </a-row>
    </div>
</template>
<script>
import { ref, onMounted, computed, shallowRef, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import StatisticalCard from '@/components/ui/StatisticalCard/index.vue';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';

import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons-vue';

export default {
    name: 'Dashboard',
    components: {
        StatisticalCard,
        MinusCircleOutlined,
        PlusCircleOutlined,
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

        const onClickToAction = (record) => {
            if (isAlreadyExistInCart(record))
                return store.dispatch('operationBag/removeOperation', {
                    type: 'deposit',
                    id: record.id,
                });

            return store.dispatch('operationBag/setDepositOperation', {
                type: 'deposit',
                operation: record,
            });
        };

        const isAlreadyExistInCart = (record) => store.getters['operationBag/isOperationExist']('deposit', record.id);

        const getActionTitle = (record) => (isAlreadyExistInCart(record) ? 'MinusCircleOutlined' : 'PlusCircleOutlined');

        const rowKey = (record) => record?.id || `assets-${record?.balanceType}-${record?.name}-${record?.address}-${record?.symbol}`;

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
            walletAccount,

            assets,

            // * Assets from IndexedDB
            assetsForAccount,

            // * Columns for the table
            columns: COLUMNS,

            radioOptions,
            activeRadio,

            rowKey,
            isAlreadyExistInCart,
            onClickToAction,
            getActionTitle,
        };
    },
};
</script>
