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
                <AssetsTable :data="nftsByCollections.list || []" type="NFTS" :columns="NFT_COLUMNS" :loading="isLoadingNFTs" />
                <div v-if="nftsByCollections.list.length >= nftIndex" class="assets-block-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleNFTsLoadMore" />
                </div>
            </a-collapse-panel>
        </a-collapse>
    </div>
</template>
<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import AssetsTable from './assets/AssetsTable';
import AssetGroupHeader from './assets/AssetGroupHeader';

import UiButton from '@/components/ui/Button.vue';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import BalancesDB from '@/services/indexed-db/balances';
import { useDexieLiveQueryWithDeps } from '@/services/indexed-db/useDexieLiveQuery';

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
        const isLoadingNFTs = ref(false);

        const { walletAccount, getDefaultAddress, currentChainInfo } = useAdapter();

        const targetAccount = computed(() => store.getters['tokens/targetAccount'] || walletAccount.value);

        const isLoadingByAccount = computed(() => store.getters['tokens/loadingByAccount'](targetAccount.value));

        const minBalance = computed(() => store.getters['tokens/minBalance']);
        const nftIndex = computed(() => store.getters['tokens/nftIndex']);

        // *********************************************************************************
        // ****************************** Protocols & NFTs **********************************
        // *********************************************************************************

        const nftsByCollections = useDexieLiveQueryWithDeps(
            [targetAccount, minBalance, nftIndex],
            async ([account, minBalance, nftIndex]) => balancesDB.getNftsByCollections(account, minBalance, nftIndex),
            {
                initialValue: {
                    list: [],
                    total: 0,
                    totalBalance: 0,
                },
            },
        );

        // *********************************************************************************
        // ****************************** Total Balances ************************************
        // *********************************************************************************

        const handleNFTsLoadMore = async () => await store.dispatch('tokens/loadMoreNFTs');

        const handleOnChangeAccount = async (account, oldAccount) => {
            if (!account) return;
            if (account === oldAccount) return;

            await store.dispatch('app/setCollapsedAssets', []);
            await store.dispatch('tokens/resetIndexes');
        };

        onMounted(() => {
            store.dispatch('tokens/resetIndexes');
        });

        onUnmounted(() => {
            store.dispatch('tokens/resetIndexes');
        });

        watch(walletAccount, async (account, oldAccount) => await handleOnChangeAccount(account, oldAccount));

        watch(isLoadingByAccount, (isLoading) => {
            if (!isLoading) return setTimeout(() => (isLoadingNFTs.value = false), 1000);
            isLoadingNFTs.value = isLoading;
        });

        return {
            isLoadingNFTs,

            collapseActiveKey,

            // ===================== Columns =====================

            NFT_COLUMNS: [
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
            ],

            handleNFTsLoadMore,

            // * Assets & Protocols & NFTs from IndexedDB
            nftsByCollections,

            nftIndex,
        };
    },
};
</script>
