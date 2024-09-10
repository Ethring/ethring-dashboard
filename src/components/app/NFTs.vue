<template>
    <div class="assets-section">
        <a-collapse v-model:activeKey="collapseActiveKey" expand-icon-position="end" class="assets-block" ghost :bordered="false">
            <a-collapse-panel key="nfts" class="assets-block-panel" :show-arrow="false" collapsible="disabled">
                <template #header>
                    <AssetGroupHeader
                        class="assets-section__group-header"
                        title="NFT Gallery"
                        :total-balance="nftsByCollections.totalBalance || 0"
                        icon="NftsIcon"
                    />
                </template>

                <a-table
                    class="assets-table"
                    expand-row-by-click
                    :columns="COLUMNS"
                    :data-source="nftsByCollections.list"
                    :pagination="false"
                    :bordered="false"
                    :scroll="{ x: 700 }"
                    :row-key="rowKey"
                    :expanded-row-keys="expandedRowKeys"
                    :show-expand-column="true"
                    @expand="onExpand"
                >
                    <template #headerCell="{ title, column }">
                        <p v-if="column && column.name">
                            {{ title }}
                        </p>
                    </template>

                    <template #bodyCell="{ column, record }">
                        <AssetItem v-if="record && column" :item="record" :column="column.dataIndex" type="NFTS" />
                    </template>

                    <template #expandedRowRender="{ index }">
                        <ExpandNftInfo v-if="nftInfoByCollection" :key="index" :record="nftInfoByCollection" />
                    </template>
                </a-table>
                <div v-if="nftsByCollections.list.length >= nftIndex" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleNFTsLoadMore" />
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

import AssetGroupHeader from '@/components/app/assets/AssetGroupHeader.vue';
import UiButton from '@/components/ui/Button.vue';

export default {
    name: 'NFTs',
    components: {
        AssetGroupHeader,
        UiButton,
    },
    setup() {
        const store = useStore();
        const isMounted = ref(false);

        const collapseActiveKey = ref(['nfts']);
        const expandedRowKeys = ref([]);

        const { walletAccount } = useAdapter();

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);
        const loadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));
        const isNeedToLoadFromIndexedDB = computed(() => store.getters['tokens/isNeedToLoadFromIndexedDB'](targetAccount.value));
        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const nftIndex = computed(() => store.getters['tokens/nftIndex']);

        // *********************************************************************************
        // * NFTs by Collections from IndexedDB
        // * ShallowRef is used to avoid reactivity issues
        // * Data is updated by the watch function
        // * This is done to avoid reactivity issues with the IndexedDB
        // *********************************************************************************

        const nftsByCollections = shallowRef({
            list: [],
            total: 0,
            totalBalance: 0,
        });

        const nftInfoByCollection = shallowRef({
            nfts: [],
        });

        // *********************************************************************************
        // * Request to IndexedDB
        // *********************************************************************************

        const getNftsByCollections = async () => {
            try {
                if (!isMounted.value) return console.log('NFTs not mounted, skipping update');
                const response = await BalancesDB.getNftsByCollections(targetAccount.value, minBalance.value, nftIndex.value);
                nftsByCollections.value = response;
            } catch (error) {
                console.error('Error requesting NFTs', error);
            }
        };

        const getNftInfoByCollection = async (collection) => {
            try {
                if (!isMounted.value) return console.log('NFTs not mounted, skipping update');
                const response = await BalancesDB.getNftInfoByCollection(targetAccount.value, collection.address, minBalance.value);
                nftInfoByCollection.value = {
                    ...collection,
                    nfts: response,
                };
            } catch (error) {
                console.error('Error requesting NFTs', error);
            }
        };

        const makeRequest = async () => {
            try {
                await getNftsByCollections();
            } catch (error) {
                console.error('Error requesting NFTs', error);
            }
        };

        // *********************************************************************************
        // * Load more NFTs
        // *********************************************************************************

        const handleNFTsLoadMore = async () => await store.dispatch('tokens/loadMoreNFTs');

        // *********************************************************************************
        // * Watch for changes in the target account, min balance, and asset index
        // *********************************************************************************

        const handleOnChangeKeysToRequest = async (
            [account, minBalance, nftIndex, isNeedToLoadFromIndexedDB],
            [oldAccount, oldMinBalance, oldNftIndex, oldLoading],
        ) => {
            if (account !== oldAccount) {
                expandedRowKeys.value = [];
                return await makeRequest();
            }

            if (minBalance !== oldMinBalance) {
                expandedRowKeys.value = [];
                return await makeRequest();
            }

            if (!isNeedToLoadFromIndexedDB) return;

            await makeRequest();
        };

        const rowKey = (record) => `NFTS-${record.address}`;

        const onExpand = async (expanded, record) => {
            if (expanded) {
                expandedRowKeys.value = [rowKey(record)];

                return await getNftInfoByCollection(record);
            }

            expandedRowKeys.value = [];

            nftInfoByCollection.value = {
                nfts: [],
            };
        };

        onMounted(async () => {
            isMounted.value = true;
            store.dispatch('tokens/resetIndexes');
            await makeRequest();
        });

        // *********************************************************************************
        // * Watchers
        // *********************************************************************************

        const unWatchKeysToRequest = watch([targetAccount, minBalance, nftIndex, isNeedToLoadFromIndexedDB], handleOnChangeKeysToRequest);

        // *********************************************************************************
        // * Unmount
        // *********************************************************************************

        onUnmounted(() => {
            isMounted.value = false;
            store.dispatch('tokens/resetIndexes');
            unWatchKeysToRequest();

            // ! Clear the NFTs
            nftsByCollections.value = {
                list: [],
                total: 0,
                totalBalance: 0,
            };
        });

        const COLUMNS = [
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
        ];

        return {
            collapseActiveKey,

            // * Assets & Protocols & NFTs from IndexedDB
            nftsByCollections,
            nftInfoByCollection,
            nftIndex,

            // * Columns for the table
            COLUMNS,

            handleNFTsLoadMore,

            rowKey,
            expandedRowKeys,
            onExpand,
        };
    },
};
</script>
