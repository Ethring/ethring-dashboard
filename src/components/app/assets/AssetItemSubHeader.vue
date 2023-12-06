<template>
    <div class="asset__item-sub-header">
        <div class="asset__item-sub-header-title">
            {{ type }}
            <span v-if="name">{{ name.trim() }}</span>
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
        },
        name: {
            default: null,
        },
    },
    setup() {},
};
</script>
<style lang="scss" scoped>
.asset__item-sub-header {
    height: 36px;

    font-weight: 500;
    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}small-sm-fs);
    border-bottom: 1px solid var(--#{$prefix}assets-header-border-color);
    margin: 8px 0 4px;

    @include pageFlexRow;

    &-title {
        display: flex;
        width: 65%;

        span::before {
            content: '\2022';
            margin: 0 4px;
            color: var(--#{$prefix}checkbox-text);
        }
    }

    &-label {
        width: 18%;

        &__right {
            width: 17%;
            text-align: right;
        }
    }
}
</style>
