<template>
    <div>
        <div class="table-header">
            <div class="table-header-title__left">
                {{ $t('dashboard.nft.collectionName') }}
            </div>
            <div class="table-header-title__center">
                {{ $t('dashboard.nft.holdings') }}
            </div>
            <div class="table-header-title__right">
                {{ $t('dashboard.nft.floorPrice') }}
            </div>
        </div>
        <AssetNftItem v-for="(collection, i) in data" :item="collection" :key="i" />
    </div>
</template>
<script>
import AssetNftItem from './AssetNftItem';

export default {
    name: 'AssetsNftTable',
    components: { AssetNftItem },
    props: {
        data: {
            require: true,
            default: [],
        },
    },
};
</script>
<style lang="scss" scoped>
.table-header {
    @include pageFlexRow;
    height: 36px;
    margin: 4px 0;

    font-weight: 500;
    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}small-sm-fs);
    border-bottom: 1px solid var(--#{$prefix}assets-header-border-color);

    &-title {
        &__left {
            width: 66%;
        }
        &__center {
            width: 18%;
        }
        &__right {
            width: 17%;
            text-align: right;
        }
    }
}
</style>
