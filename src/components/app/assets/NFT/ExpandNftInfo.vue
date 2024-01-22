<template>
    <a-row class="nft-info-container" gutter="12">
        <a-col :span="10">
            <a-row wrap class="nft-list" :gutter="[12, 12]">
                <a-col :span="8" v-for="(nft, i) in record.nfts" :key="i">
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
import NFTItem from './NFTItem.vue';
import NFTInfo from './NFTInfo.vue';

export default {
    name: 'ExpandNftInfo',
    props: {
        record: {
            required: true,
            type: Object,
            default: () => ({}),
        },
    },
    components: {
        NFTItem,
        NFTInfo,
    },
};
</script>
<style lang=""></style>
