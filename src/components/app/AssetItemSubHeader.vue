<template>
    <div class="asset__item-sub-header">
        <div class="asset__item-sub-header-title">
            {{ type }}
            <span v-if="name">{{ name.trim() }}</span>
        </div>
        <div class="asset__item-sub-header-label">
            {{ $t('tokenOperations.balance') }}
        </div>
        <div class="asset__item-sub-header-label__right">
            {{ $t('tokenOperations.value') }}
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

    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}small-sm-fs);
    margin: 16px 0 8px;

    display: flex;
    align-items: center;

    &-title {
        display: flex;
        width: 58%;

        span::before {
            content: '\2022';
            margin: 0 4px;
            color: var(--#{$prefix}checkbox-text);
        }
    }

    &-label {
        width: 22%;

        &__right {
            width: 20%;
            text-align: right;
        }
    }
}
</style>
