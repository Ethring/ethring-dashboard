<template>
    <div class="asset__item-sub-header">
        <div class="asset__item-sub-header-title">
            {{ type }}
        </div>
        <div class="asset__item-sub-header-label">
            {{ secondColumnType || $t('tokenOperations.balance') }}
        </div>
        <div class="asset__item-sub-header-label__right">
            {{ thirdColumnType || $t('tokenOperations.value') }}
        </div>
    </div>
</template>
<script>
export default {
    name: 'AssetItemSubHeader',
    props: {
        type: {
            required: true,
        },
        secondColumnType: {
            required: false,
            default: null,
        },
        thirdColumnType: {
            required: false,
            default: null,
        },
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.asset__item-sub-header {
    background: var(--#{$prefix}banner-secondary-color);
    border-radius: 4px;
    padding: 7px 16px;

    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}small-sm-fs);
    margin: 16px 0;

    display: flex;
    align-items: center;

    &-title {
        display: flex;
        width: 60%;
    }

    &-label {
        width: 20%;

        &__right {
            width: 20%;
            text-align: right;
        }
    }
}
</style>
