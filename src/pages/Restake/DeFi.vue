<template>
    <div class="dashboard">
        <!-- <a-row :gutter="16" class="dashboard__stats-row">
            <StatisticalCard title="Portfolio Value" :value="0" :precision="2" prefix="$" />
            <StatisticalCard title="Average APR" :value="0" :precision="2" suffix="%" class="demo-class" />
        </a-row> -->

        <a-row>
            <a-col :span="24">
                <a-table
                    class="asset-table"
                    :columns="columns"
                    :data-source="stakeAssets"
                    :pagination="false"
                    :bordered="false"
                    :scroll="{ x: 1000 }"
                    :row-key="(record) => rowKey(record)"
                >
                    <template #bodyCell="{ column, record }">
                        <AssetRow v-if="record && column" :item="record" :column="column.dataIndex">
                            <template #actions>
                                <div
                                    class="asset-table__actions"
                                    type="link"
                                    :class="{
                                        'asset-table__actions--added':
                                            isAlreadyExistInCart(record) || isAlreadyExistInCart(record, 'withdraw'),
                                    }"
                                >
                                    <div
                                        class="asset-table__action asset-table__action--deposit"
                                        :class="{
                                            'asset-table__action--added-to-bag': isAlreadyExistInCart(record),
                                            'asset-table__action--disabled': !isAllowToAddOps,
                                        }"
                                        @click="() => isAllowToAddOps && onClickToAction(record)"
                                    >
                                        <DepositIcon class="asset-table__action-icon" />
                                        <span> Deposit </span>
                                    </div>
                                    <div
                                        class="asset-table__action asset-table__action--withdraw"
                                        :class="{
                                            'asset-table__action--added-to-bag': isAlreadyExistInCart(record, 'withdraw'),
                                            'asset-table__action--disabled': !isAllowToAddOps,
                                        }"
                                        @click="() => isAllowToAddOps && onClickToAction(record, 'withdraw')"
                                    >
                                        <WithdrawIcon class="asset-table__action-icon" />
                                        <span> Withdraw </span>
                                    </div>

                                    <div
                                        class="asset-table__action asset-table__action--added"
                                        :class="{
                                            'asset-table__action--added-show':
                                                isAlreadyExistInCart(record) || isAlreadyExistInCart(record, 'withdraw'),
                                        }"
                                        @click="() => onClickToAction(record, isAlreadyExistInCart(record) ? 'deposit' : 'withdraw')"
                                    >
                                        <AddedIcon class="asset-table__action-icon" />
                                        <RemoveIcon class="asset-table__action-icon asset-table__action-icon--remove" />

                                        <span class="asset-table__action-text"> Added </span>
                                        <span class="asset-table__action-text asset-table__action-text--remove"> Remove </span>
                                    </div>
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

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';

import DepositIcon from '@/assets/icons/dashboard/deposit.svg';
import WithdrawIcon from '@/assets/icons/dashboard/withdraw.svg';
import AddedIcon from '@/assets/icons/dashboard/added.svg';
import RemoveIcon from '@/assets/icons/dashboard/remove.svg';

export default {
    name: 'RestakeDeFi',
    components: {
        DepositIcon,
        WithdrawIcon,
        AddedIcon,
        RemoveIcon,
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
                title: 'Chain',
                dataIndex: 'chain',
                key: 'chain',
            },
            {
                title: 'Value',
                dataIndex: 'balanceUsd',
                key: 'balanceUsd',
                sorter: (prev, next) => prev.balanceUsd - next.balanceUsd,
            },
            {
                title: 'Position',
                dataIndex: 'balance',
                key: 'balance',
                sorter: (prev, next) => prev.balance - next.balance,
            },
            {
                title: 'TVL',
                dataIndex: 'tvl',
                key: 'tvl',
            },
            {
                title: 'APY',
                dataIndex: 'apy',
                key: 'apy',
            },
            {
                title: 'Rewards',
                dataIndex: 'rewards',
                key: 'rewards',
            },
            {
                dataIndex: 'actions',
            },
        ];

        const radioOptions = [
            { key: 'Assets', value: 'assets' },
            { key: 'DeFi', value: 'defi' },
        ];

        const isAllowToAddOps = computed(() => store.getters['operationBag/isAllowToAddOps']);

        const isLoadingBalances = computed(() =>
            walletAccount.value ? store.getters['tokens/loadingByAccount'](walletAccount.value) : false,
        );

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

        const stakeAssets = computed(() => {
            const assets = store.getters['stakeAssets/getDeFiAssets'];
            return assets.map((asset) => {
                const balance = assetsForAccount.value.list.find((item) => item.id === asset.id);
                return {
                    ...asset,
                    balance: balance?.balance || 0,
                    balanceUsd: balance?.balanceUsd || 0,
                    apy: balance?.apy || 0,
                };
            });
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

        // *********************************************************************************

        const makeRequest = async () => {
            try {
                await getAssetsForAccount();
            } catch (error) {
                console.error('Error requesting assets', error);
            }
        };

        const onClickToAction = (record, type = 'deposit') => {
            if (isAlreadyExistInCart(record, type))
                return store.dispatch('operationBag/removeOperation', {
                    type,
                    id: record.id,
                });

            return store.dispatch('operationBag/setOperation', {
                type,
                operation: record,
            });
        };

        const isAlreadyExistInCart = (record, type = 'deposit') => store.getters['operationBag/isOperationExist'](type, record.id);

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

            stakeAssets,

            // * Assets from IndexedDB
            assetsForAccount,

            // * Columns for the table
            columns: COLUMNS,

            isAllowToAddOps,

            radioOptions,
            activeRadio,

            rowKey,
            isAlreadyExistInCart,
            onClickToAction,
        };
    },
};
</script>
