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
    background: var(--#{$prefix}banner-secondary-color);
    border-radius: 4px;
    padding: 7px 16px;

    font-weight: 500;
    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}small-sm-fs);
    margin: 16px 0 8px;
    height: 32px;
    @include pageFlexRow;

    &-title {
        display: flex;
        width: 66%;

        span::before {
            content: '\2022';
            margin: 0 4px;
            color: var(--#{$prefix}checkbox-text);
        }
    }

    &-label {
        width: 18%;

        &__right {
            width: 15%;
            text-align: right;
        }
    }
}
</style>
