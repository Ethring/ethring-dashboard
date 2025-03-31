<template>
    <a-row class="nft-info-container" :gutter="12">
        <a-col :span="10">
            <a-row wrap class="nft-list" :gutter="[12, 12]">
                <a-col v-for="(nft, i) in record.nfts.slice(0, visibleCount)" :key="i" :span="12">
                    <NFTItem :nft="nft" />
                </a-col>
                <a-col v-if="visibleCount < record.nfts.length" :span="24" class="nft-info-show-more">
                    <UiButton :title="$t('tokenOperations.showMore')" @click="handleLoadMore" />
                </a-col>
            </a-row>
        </a-col>

        <a-col :span="14" class="nft-info-block">
            <NFTInfo :record="record" />
        </a-col>
    </a-row>
</template>
<script>
import { ref } from 'vue';

import NFTItem from '@/components/app/assets/NFT/NFT-Item.vue';
import NFTInfo from '@/components/app/assets/NFT/NFT-Info.vue';

import UiButton from '@/components/ui/Button.vue';

export default {
    name: 'ExpandNftInfo',
    components: {
        NFTItem,
        NFTInfo,

        UiButton,
    },
    props: {
        record: {
            required: true,
            type: Object,
            default: () => ({}),
        },
    },
    setup() {
        const MAX_NFT_PER_PAGE = 4;

        const visibleCount = ref(MAX_NFT_PER_PAGE);

        const handleLoadMore = () => {
            visibleCount.value += MAX_NFT_PER_PAGE;
        };

        return {
            visibleCount,
            handleLoadMore,
        };
    },
};
</script>
<style lang=""></style>
