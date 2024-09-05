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
                <AssetsTable :data="nftsByCollections.list || []" type="NFTS" :columns="COLUMNS" />
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

import AssetsTable from '@/components/app/assets/AssetsTable.vue';
import AssetGroupHeader from '@/components/app/assets/AssetGroupHeader.vue';
import UiButton from '@/components/ui/Button.vue';

export default {
    name: 'NFTs',
    components: {
        AssetGroupHeader,
        AssetsTable,
        UiButton,
    },
    setup() {
        const store = useStore();
        const balancesDB = new BalancesDB(1);

        const collapseActiveKey = ref(['nfts']);

        const { walletAccount } = useAdapter();

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);
        const loadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));
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

        // *********************************************************************************
        // * Request to IndexedDB
        // *********************************************************************************

        const getNftsByCollections = async () => {
            try {
                const response = await balancesDB.getNftsByCollections(targetAccount.value, minBalance.value, nftIndex.value);
                nftsByCollections.value = response;
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

        const handleOnChangeKeysToRequest = async ([account, minBalance, nftIndex, loading]) => {
            // ! If loading is true, do not request
            if (loading) return;
            await makeRequest();
        };

        onMounted(async () => {
            console.log('NFTs mounted');
            store.dispatch('tokens/resetIndexes');
            await makeRequest();
        });

        // *********************************************************************************
        // * Watchers
        // *********************************************************************************

        const unWatchKeysToRequest = watch([targetAccount, minBalance, nftIndex, loadingByAccount], handleOnChangeKeysToRequest, {
            immediate: true,
        });

        // *********************************************************************************
        // * Unmount
        // *********************************************************************************

        onUnmounted(() => {
            console.log('NFTs unmounted');
            store.dispatch('tokens/resetIndexes');
            unWatchKeysToRequest();

            // ! Close the IndexedDB connection
            balancesDB.close();
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
            nftIndex,

            // * Columns for the table
            COLUMNS,

            handleNFTsLoadMore,
        };
    },
};
</script>
