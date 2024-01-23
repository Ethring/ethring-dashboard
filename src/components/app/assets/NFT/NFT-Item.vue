<template>
    <a-card size="small" class="nft-item">
        <template #cover>
            <a-image :preview="true" :src="nft.avatar" class="nft-item-avatar" :fallback="nftPlaceholder" />
        </template>
        <a-card-meta>
            <template #title>{{ nft.name }}</template>
            <template #description>
                {{ nft.price }}
                {{ nft.token?.symbol }}
            </template>
        </a-card-meta>
    </a-card>
</template>
<script>
import NftPlaceholder from '@/assets/images/placeholder/mask.png';
export default {
    name: 'NFTItem',
    props: {
        nft: {
            required: true,
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            nftPlaceholder: NftPlaceholder,
        };
    },
};
</script>
