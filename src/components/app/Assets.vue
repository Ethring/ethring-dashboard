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
                        :total-balance="assetsForAccount.totalBalance || 0"
                    />
                </template>

                <AssetsTable
                    type="Asset"
                    :data="assetsForAccount.list"
                    :columns="[DEFAULT_NAME_COLUMN, ...DEFAULT_COLUMNS]"
                    :loading="isLoadingAssets"
                />

                <div v-if="assetsForAccount.total > assetsForAccount.list.length" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleAssetLoadMore" />
                </div>
            </a-collapse-panel>

            <a-collapse-panel
                v-for="item in integrationByPlatforms.list"
                v-show="isAllTokensLoading || integrationByPlatforms.list.length > 0"
                :key="item?.platform"
                class="assets-block-panel"
                @vue:mounted="updateCollapsedKey(item)"
            >
                <template #header>
                    <AssetGroupHeader
                        v-if="item?.platform"
                        class="assets-section__group-header"
                        :logo-u-r-i="item.logoURI"
                        :title="item.platform"
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
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import AssetsTable from './assets/AssetsTable';
import AssetGroupHeader from './assets/AssetGroupHeader';

import UiButton from '@/components/ui/Button.vue';

import ArrowDownIcon from '@/assets/icons/form-icons/arrow-down.svg';

import { getFormattedName } from '@/shared/utils/assets';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';
import { useDexieLiveQueryWithDeps } from '@/services/indexed-db/useDexieLiveQuery';

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
        const balancesDB = new BalancesDB(1);

        const collapseActiveKey = ref([]);
        const isLoadingAssets = ref(false);

        const { walletAccount, getDefaultAddress, currentChainInfo } = useAdapter();

        const collapsedAssets = computed(() => store.getters['app/collapsedAssets']);
        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);

        const isLoadingForChain = computed(() => store.getters['tokens/loadingByChain'](targetAccount.value, currentChainInfo.value?.net));
        const isLoadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));
        const isAllTokensLoading = computed(() => store.getters['tokens/loader']);

        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const assetIndex = computed(() => store.getters['tokens/assetIndex']);

        // *********************************************************************************
        // ****************************** Assets *******************************************
        // *********************************************************************************

        const assetsForAccount = useDexieLiveQueryWithDeps(
            [targetAccount, minBalance, assetIndex],
            async ([account, minBalance, assetIndex]) => await balancesDB.getAssetsForAccount(account, minBalance, assetIndex),
            {
                initialValue: {
                    list: [],
                    total: 0,
                    totalBalance: 0,
                },
            },
        );

        // *********************************************************************************
        // ****************************** Protocols **********************************
        // *********************************************************************************
        const integrationByPlatforms = useDexieLiveQueryWithDeps(
            [targetAccount, minBalance],
            async ([account, minBalance]) => await balancesDB.getProtocolsByPlatforms(account, minBalance),
            {
                initialValue: {
                    list: [],
                    total: 0,
                    totalBalance: 0,
                },
            },
        );

        const isEmpty = computed(
            () =>
                !assetsForAccount.value.length &&
                !integrationByPlatforms.value.list.length &&
                !isLoadingForChain.value &&
                !isAllTokensLoading.value,
        );

        const allCollapsedActiveKeys = computed(() => {
            const keys = ['assets'];

            if (integrationByPlatforms.value.list.length) integrationByPlatforms.value.list.forEach((item) => keys.push(item.platform));

            return keys;
        });

        const updateCollapsedAssets = () => {
            if (!collapsedAssets.value.length) collapseActiveKey.value = allCollapsedActiveKeys.value;
            collapseActiveKey.value = allCollapsedActiveKeys.value.filter((key) => !collapsedAssets.value.includes(key));
        };

        const updateCollapsedKey = (item) => {
            if (!item) return;
            if (!collapsedAssets.value.includes(item.platform)) collapseActiveKey.value.push(item.platform);
        };

        const handleAssetLoadMore = async () => await store.dispatch('tokens/loadMoreAssets');
        const handleOnChangeAccount = async (account, oldAccount) => {
            if (!account) return;
            if (account === oldAccount) return;

            await store.dispatch('app/setCollapsedAssets', []);
            await store.dispatch('tokens/resetIndexes');
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
            updateCollapsedAssets();
            await store.dispatch('tokens/resetIndexes');
        });

        onBeforeUnmount(async () => {
            updateCollapsedAssets();
            await store.dispatch('tokens/resetIndexes');
        });

        watch(walletAccount, async (account, oldAccount) => await handleOnChangeAccount(account, oldAccount));

        watch(isLoadingByAccount, (isLoading) => {
            if (!isLoading) return setTimeout(() => (isLoadingAssets.value = false), 1000);
            isLoadingAssets.value = isLoading;
        });

        return {
            isLoadingForChain,
            isLoadingByAccount,
            isLoadingAssets,
            isAllTokensLoading,

            isEmpty,

            // utils for Assets templates
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

            handleAssetLoadMore,

            // * Assets & Protocols from IndexedDB
            assetsForAccount,
            integrationByPlatforms,
        };
    },
};
</script>
