<template>
    <a-row class="nft-info-container" :gutter="12">
        <a-col :span="10">
            <a-row wrap class="nft-list" :gutter="[12, 12]">
                <a-col v-for="(nft, i) in record.nfts" :key="i" :span="12">
                    <NFTItem :nft="nft" />
                </a-col>
            </a-row>
        </a-col>

        <a-col :span="14" class="nft-info-block">
            <NFTInfo :record="record" />
        </a-col>
    </a-row>
</template>
<script>
import NFTItem from '@/components/app/assets/NFT/NFT-Item.vue';
import NFTInfo from '@/components/app/assets/NFT/NFT-Info.vue';

export default {
    name: 'ExpandNftInfo',
    components: {
        NFTItem,
        NFTInfo,
    },
    props: {
        record: {
            required: true,
            type: Object,
            default: () => ({}),
        },
    },
};
</script>
<style lang=""></style>
