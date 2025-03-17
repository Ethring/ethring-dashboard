<template>
    <div class="dashboard">
        <a-row :gutter="16" class="dashboard__stats-row">
            <a-dropdown placement="bottom" arrow class="chains-menu dashboard__filters">
                <div class="ant-dropdown-link">
                    Select Chain
                    <DownOutlined />
                </div>
                <template #overlay>
                    <a-menu class="chains-menu__dropdown">
                        <a-checkbox v-model:checked="isAllChains" class="check-all-chains" @change="onCheckAllChains">
                            All Chains
                        </a-checkbox>
                        <a-divider class="divider" />
                        <a-checkbox-group
                            v-model:value="filters.chains"
                            name="checkboxgroup"
                            :options="chainsOptions"
                            class="chains-checkbox"
                        >
                            <template #label="{ label, logo }">
                                <div class="filters-checkbox-with-icon">
                                    <TokenIcon
                                        :token="{
                                            logo,
                                            symbol: label,
                                        }"
                                        width="24"
                                        height="24"
                                    />

                                    <span>{{ label }}</span>
                                </div>
                            </template>
                        </a-checkbox-group>
                    </a-menu>
                </template>
            </a-dropdown>

            <div class="dashboard__filters" @click="(e) => openFiltersModal(e)">
                <FiltersIcon />
                Filters

                <div v-if="totalCountOfFilters > 0" class="dashboard__filters-count">
                    <a-badge :count="totalCountOfFilters" class="filters-badge-count" color="#969696" />
                    <CloseOutlined class="dashboard__filters-close" @click="resetFilters" />
                </div>
            </div>

            <StatisticalCard class="dashboard__stats" title="Portfolio Value" :value="totalBalance" :precision="2" prefix="$" />
            <!-- <StatisticalCard title="Average APR" :value="0" :precision="2" suffix="%" class="demo-class" /> -->
        </a-row>

        <a-row>
            <a-col :span="24">
                <a-table
                    class="asset-table"
                    :columns="columns"
                    :data-source="stakeAssets"
                    :pagination="{
                        position: ['bottomCenter'],
                        pageSize: 20,
                        showSizeChanger: false,
                    }"
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
                                            isAlreadyExistInCart(record, 'deposit') || isAlreadyExistInCart(record, 'withdraw'),
                                    }"
                                >
                                    <div
                                        class="asset-table__action asset-table__action--deposit"
                                        :class="{
                                            'asset-table__action--added-to-bag': isAlreadyExistInCart(record, 'deposit'),
                                            'asset-table__action--disabled': !isAllowToAddOps,
                                        }"
                                        @click="() => isAllowToAddOps && onClickToAction(record, 'deposit')"
                                    >
                                        <DepositIcon class="asset-table__action-icon" />
                                        <span> Deposit </span>
                                    </div>
                                    <div
                                        class="asset-table__action asset-table__action--withdraw"
                                        :class="{
                                            'asset-table__action--added-to-bag':
                                                isAlreadyExistInCart(record) || isAlreadyExistInCart(record, 'withdraw'),
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
                                        @click="
                                            () => onClickToAction(record, isAlreadyExistInCart(record, 'withdraw') ? 'withdraw' : 'deposit')
                                        "
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

                    <template #emptyText>
                        <div class="asset-table__empty">
                            <AssetsNotFoundIcon />
                            <p>No assets found</p>

                            <router-link to="/restake">
                                <a-button type="primary" class="go-to-page">
                                    <RestakeIcon />
                                    Go to restake
                                </a-button>
                            </router-link>
                        </div>
                    </template>
                </a-table>
            </a-col>
        </a-row>
    </div>
</template>
<script>
import { ref, onMounted, computed, shallowRef, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';

import DepositIcon from '@/assets/icons/dashboard/deposit.svg';
import WithdrawIcon from '@/assets/icons/dashboard/withdraw.svg';
import AddedIcon from '@/assets/icons/dashboard/added.svg';
import RemoveIcon from '@/assets/icons/dashboard/remove.svg';
import FiltersIcon from '@/assets/icons/dashboard/filters.svg';
import AssetsNotFoundIcon from '@/assets/icons/dashboard/assets-not-found.svg';
import RestakeIcon from '@/assets/icons/dashboard/restake.svg';

import { CloseOutlined, DownOutlined } from '@ant-design/icons-vue';
import { useAssetFilters } from '@/compositions/useAssetFilters';

export default {
    name: 'DashboardAssets',
    components: {
        DepositIcon,
        WithdrawIcon,
        AddedIcon,
        RemoveIcon,
        FiltersIcon,
        CloseOutlined,
        AssetsNotFoundIcon,
        RestakeIcon,
        DownOutlined,
    },
    setup() {
        const activeRadio = ref('assets');

        const store = useStore();

        const { openFiltersModal, resetFilters, onCheckAllChains, isAllChains, totalCountOfFilters, chainsOptions, filters } =
            useAssetFilters();

        const isMounted = ref(false);
        const { walletAccount } = useAdapter();

        const COLUMNS = [
            {
                title: 'Asset',
                dataIndex: 'asset',
                key: 'asset',
                sorter: (prev, next) => prev.name.localeCompare(next.name),
            },
            {
                title: 'Yield Type',
                dataIndex: 'category',
                key: 'category',
                sorter: (prev, next) => prev.category?.name.localeCompare(next.category?.name),
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
                defaultSortOrder: 'descend',
                sorter: (prev, next) => prev.tvl - next.tvl,
            },
            {
                title: '24H APY',
                dataIndex: 'apy24h',
                key: 'apy24h',
                sorter: (prev, next) => {
                    const prevApy = prev.apy.find((p) => p.apyType === 'base')?.apy ?? 0;
                    const nextApy = next?.apy.find((n) => n.apyType === 'base')?.apy ?? 0;

                    return prevApy - nextApy;
                },
            },
            {
                title: '7D APY',
                dataIndex: 'apy7d',
                key: 'apy7d',
                sorter: (prev, next) => {
                    const prevApy = prev.apy.find((p) => p.apyType === '7d')?.apy ?? 0;
                    const nextApy = next?.apy.find((n) => n.apyType === '7d')?.apy ?? 0;

                    return prevApy - nextApy;
                },
            },
            {
                title: '30D APY',
                dataIndex: 'apy30d',
                key: 'apy30d',
                sorter: (prev, next) => {
                    const prevApy = prev.apy.find((p) => p.apyType === '30d')?.apy ?? 0;
                    const nextApy = next?.apy.find((n) => n.apyType === '30d')?.apy ?? 0;

                    return prevApy - nextApy;
                },
            },
            {
                title: 'Rewards',
                dataIndex: 'rewards',
                key: 'rewards',
                sorter: (prev, next) => prev.rewards.length - next.rewards.length,
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

        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const assetIndex = computed(() => store.getters['tokens/assetIndex']);
        const isNeedToLoadFromIndexedDB = computed(() => store.getters['tokens/isNeedToLoadFromIndexedDB'](walletAccount.value));

        // *********************************************************************************
        // * Assets from IndexedDB
        // * ShallowRef is used to avoid reactivity issues
        // * Data is updated by the watch function
        // * This is done to avoid reactivity issues with the IndexedDB
        // *********************************************************************************

        const allBalances = shallowRef({
            list: [],
        });

        const stakeAssets = computed(() => {
            const assets = store.getters['stakeAssets/getStakeAssets'];
            if (!assets.length) return [];
            if (!allBalances.value.list.length) return [];

            // * get assets only with balance
            const balances = assets.reduce((acc, asset) => {
                const balance = allBalances.value.list.find((item) => item.id === asset.id);
                if (balance) acc.push({ ...asset, balance: balance.balance, balanceUsd: balance.balanceUsd });
                return acc;
            }, []);

            return balances;
        });

        const totalBalance = computed(() => {
            if (!stakeAssets.value.length) return 0;
            const sum = stakeAssets.value.reduce((acc, item) => {
                const balance = new BigNumber(item.balanceUsd);
                return acc.plus(balance);
            }, new BigNumber(0));

            const formatter = new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1,
            });

            return formatter.format(sum.toNumber());
        });

        // *********************************************************************************
        // * Request to IndexedDB
        // *********************************************************************************

        const getAssetsForAccount = async () => {
            if (!walletAccount.value) return;

            try {
                if (!isMounted.value) return console.log('Assets not mounted, skipping update');
                const [assets, poolAssets] = await Promise.all([
                    BalancesDB.getAssetsForAccount(walletAccount.value, minBalance.value, {
                        isAll: true,
                        assetIndex: assetIndex.value,
                    }),
                    BalancesDB.getPoolsForAccount(walletAccount.value, minBalance.value, {
                        isAll: true,
                        assetIndex: assetIndex.value,
                    }),
                ]);
                allBalances.value = { list: [...assets.list, ...poolAssets.list] };
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
            if (!account) {
                allBalances.value = { list: [] };
                return;
            }
            if (isNeedToLoadFromIndexedDB) return await makeRequest();

            return await makeRequest();
        };

        // *********************************************************************************
        // * OnMounted
        // *********************************************************************************

        onMounted(async () => {
            await store.dispatch('stakeAssets/setStakeTokens');
            isMounted.value = true;
            await makeRequest();
        });

        // *********************************************************************************
        // * Watchers
        // *********************************************************************************

        const unWatchKeysToRequest = watch([walletAccount, minBalance, assetIndex, isNeedToLoadFromIndexedDB], handleOnChangeKeysToRequest);

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

            totalBalance,
            stakeAssets,

            // * Columns for the table
            columns: COLUMNS,

            isAllowToAddOps,

            radioOptions,
            activeRadio,

            rowKey,
            isAlreadyExistInCart,
            onClickToAction,

            openFiltersModal,
            totalCountOfFilters,
            resetFilters,
            chainsOptions,
            isAllChains,
            filters,
            onCheckAllChains,
        };
    },
};
</script>
