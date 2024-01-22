<template>
    <div class="asset-with-chain">
        <TokenIcon v-if="type === 'asset'" :width="width" :height="height" :token="asset" />
        <a-image
            v-else
            :preview="false"
            class="asset-with-chain__nft-img"
            :width="width"
            :height="height"
            :src="asset.avatar"
            :fallback="nftPlaceholder"
        />
        <div class="chain">
            <TokenIcon width="16" :height="16" :token="chain" />
        </div>
    </div>
</template>
<script>
import TokenIcon from '@/components/ui/Tokens/TokenIcon';
import NftPlaceholder from '@/assets/images/placeholder/nft.png';

export default {
    name: 'AssetWithChain',
    components: {
        TokenIcon,
    },
    props: {
        type: {
            type: String,
            required: true,
            default: 'asset',
        },
        asset: {
            type: Object,
            required: true,
        },
        chain: {
            type: Object,
            required: true,
        },
        width: {
            type: Number,
            default: 32,
        },
        height: {
            type: Number,
            default: 32,
        },
    },
    data() {
        return {
            nftPlaceholder: NftPlaceholder,
        };
    },
};
</script>
<style lang="scss">
.asset-with-chain {
    position: relative;
    .chain {
        position: absolute;
        right: -10px;
        bottom: 0;
    }
}

.asset-with-chain__nft {
    &-img {
        max-width: 32px;
        max-height: 32px;

        border-radius: 4px;
        object-fit: contain;

        border: 0.2px solid var(--#{$prefix}icon-placeholder-border);
        background-color: var(--#{$prefix}icon-placeholder);
    }
}
</style>
