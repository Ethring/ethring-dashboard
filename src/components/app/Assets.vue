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
            <a-collapse-panel v-once key="assets" class="assets-block-panel" data-qa="assets-panel">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="Tokens"
                        icon="TokensIcon"
                        :total-balance="assetsForAccount.totalBalance || 0"
                    />
                </template>

                <AssetsTable v-once type="Asset" :data="assetsForAccount.list" :columns="ASSET_COLUMNS" />

                <div v-if="assetsForAccount.total > assetsForAccount.list.length" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showAll')" @click="handleShowAllAssets" />
                </div>
            </a-collapse-panel>

            <template v-if="integrationByPlatforms.list.length > 0">
                <a-collapse-panel
                    v-for="item in integrationByPlatforms.list"
                    :key="item.platform"
                    class="assets-block-panel"
                    @vue:mounted="handleOnMountPlatform(item?.platform)"
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
                        :columns="[{ ...COMMON_NAME_COLUMN, title: groupItem?.name }, ...COMMON_COLUMNS]"
                        :type="getFormattedName(groupItem.type)"
                        :name="groupItem?.validator?.name"
                    />
                </a-collapse-panel>
            </template>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, onMounted, watch, onUnmounted, shallowRef, onActivated } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import BalancesDB from '@/services/indexed-db/balances';

import AssetsTable from '@/components/app/assets/AssetsTable.vue';
import AssetGroupHeader from '@/components/app/assets/AssetGroupHeader.vue';
import UiButton from '@/components/ui/Button.vue';
import ArrowDownIcon from '@/assets/icons/form-icons/arrow-down.svg';

import { getFormattedName } from '@/shared/utils/assets';
import { delay } from '@/shared/utils/helpers';

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
        const router = useRouter();

        const isMounted = ref(false);

        const { walletAccount } = useAdapter();

        // *********************************************************************************
        // * Computed values from Vuex
        // *********************************************************************************

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);
        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const assetIndex = computed(() => store.getters['tokens/assetIndex']);
        const loadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));
        const isNeedToLoadFromIndexedDB = computed(() => store.getters['tokens/isNeedToLoadFromIndexedDB'](targetAccount.value));

        const collapseActiveKey = ref(['assets']);

        const collapsedAssets = computed({
            get: () => store.getters['app/collapsedAssets'],
            set: (value) => store.dispatch('app/setCollapsedAssets', value),
        });

        // *********************************************************************************
        // * Assets & Protocols from IndexedDB
        // * ShallowRef is used to avoid reactivity issues
        // * Data is updated by the watch function
        // * This is done to avoid reactivity issues with the IndexedDB
        // *********************************************************************************

        const assetsForAccount = shallowRef({
            list: [],
            total: 0,
            totalBalance: 0,
        });

        const integrationByPlatforms = shallowRef({
            list: [],
            total: 0,
            totalBalance: 0,
        });

        // *********************************************************************************
        // * Request to IndexedDB
        // *********************************************************************************

        const getIntegrationByPlatforms = async () => {
            try {
                if (!isMounted.value) return console.log('Not mounted, skipping integrationByPlatforms');
                const response = await BalancesDB.getProtocolsByPlatforms(walletAccount.value, minBalance.value);
                integrationByPlatforms.value = response;
            } catch (error) {
                console.error('Error getting protocols by platforms', error);
            }
        };

        const getAssetsForAccount = async () => {
            try {
                if (!isMounted.value) return console.log('Not mounted, skipping assetsForAccount');
                const response = await BalancesDB.getAssetsForAccount(walletAccount.value, minBalance.value, {
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
                await delay(300);
                await getIntegrationByPlatforms();
            } catch (error) {
                console.error('Error requesting assets & integrations', error);
            }
        };

        // *********************************************************************************
        // * Computed values
        // *********************************************************************************

        const allActiveKeys = computed(() => {
            const list = integrationByPlatforms.value.list.reduce((acc, item) => {
                acc.push(item.platform);
                return acc;
            }, []);

            return ['assets', ...list];
        });

        // *********************************************************************************
        // * Other Methods
        // *********************************************************************************

        const handleOnMountPlatform = (platform) => {
            if (!platform) return;
            if (!collapsedAssets.value.includes(platform)) return collapseActiveKey.value.push(platform);
        };

        const handleOnUpdateCollapsedAssets = () => {
            if (!collapsedAssets.value.length) return (collapseActiveKey.value = allActiveKeys.value);
            collapseActiveKey.value = allActiveKeys.value.filter((key) => !collapsedAssets.value.includes(key));
        };

        const handleShowAllAssets = () => {
            router.push({ path: `/main/tokens` });
            store.dispatch('tokens/loadMoreAssets');
        };

        // *********************************************************************************
        // * Watcher's functions
        // *********************************************************************************

        const handleOnChangeAccount = async (account, oldAccount) => {
            if (!account) return;
            if (account === oldAccount) return;
            await store.dispatch('tokens/resetIndexes');
        };

        const handleOnChangeActiveKey = (keys) => {
            if (!keys.includes('assets')) store.dispatch('tokens/resetIndexes', { resetAssets: true, resetNFTs: false });
            if (!keys.includes('nfts')) store.dispatch('tokens/resetIndexes', { resetAssets: false, resetNFTs: true });
            collapsedAssets.value = allActiveKeys.value.filter((key) => !keys.includes(key));
        };

        const handleOnChangeKeysToRequest = async ([account, minBalance, assetIndex, isNeedToLoadFromIndexedDB]) => {
            if (!isNeedToLoadFromIndexedDB) return;
            return await makeRequest();
        };

        // *********************************************************************************
        // * OnActivated
        // *********************************************************************************

        onActivated(async () => {
            isMounted.value = true;
            handleOnUpdateCollapsedAssets();
            store.dispatch('tokens/resetIndexes');
        });

        // *********************************************************************************
        // * OnMounted
        // *********************************************************************************

        onMounted(async () => {
            isMounted.value = true;
            handleOnUpdateCollapsedAssets();
            store.dispatch('tokens/resetIndexes');
            await makeRequest();
        });

        // *********************************************************************************
        // * Watchers
        // *********************************************************************************

        const unWatchAccount = watch(walletAccount, async (account, oldAccount) => await handleOnChangeAccount(account, oldAccount));

        const unWatchKeysToRequest = watch([targetAccount, minBalance, assetIndex, isNeedToLoadFromIndexedDB], handleOnChangeKeysToRequest);

        // *********************************************************************************
        // * OnUnmounted
        // *********************************************************************************

        onUnmounted(() => {
            isMounted.value = false;
            store.dispatch('tokens/resetIndexes');
            handleOnUpdateCollapsedAssets();

            // ! Unwatch the watcher to avoid memory leaks
            unWatchAccount();
            unWatchKeysToRequest();

            // ! Clear the data
            assetsForAccount.value = { list: [], total: 0, totalBalance: 0 };
            integrationByPlatforms.value = { list: [], total: 0, totalBalance: 0 };
        });

        const COMMON_NAME_COLUMN = {
            title: 'Asset',
            dataIndex: 'name',
            key: 'name',
            width: '55%',
            align: 'left',
            name: 'name',
        };

        const COMMON_COLUMNS = [
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

        const ASSET_COLUMNS = [COMMON_NAME_COLUMN, ...COMMON_COLUMNS];

        return {
            // * Assets & Protocols from IndexedDB
            assetsForAccount,
            integrationByPlatforms,

            collapseActiveKey,

            getFormattedName,

            handleOnMountPlatform,
            handleOnChangeActiveKey,

            handleShowAllAssets,

            // * Columns for the table
            ASSET_COLUMNS,
            COMMON_NAME_COLUMN,
            COMMON_COLUMNS,
        };
    },
};
</script>
