<template>
    <AppLayout component="bridge">
        <div class="bridge-page-tab">
            <router-link class="bridge-page__title" to="/send">{{ $t('simpleSend.title') }}</router-link>
            <div class="bridge-page__title__active bridge-page-tab__active">
                {{ $t('simpleBridge.title') }}
                <ArrowUpIcon class="arrow" />
            </div>
        </div>
    </AppLayout>
</template>
<script>
import AppLayout from '@/layouts/AppLayout.vue';
import ArrowUpIcon from '@/assets/icons/dashboard/arrowup.svg';

export default {
    name: 'Bridge',
    components: {
        AppLayout,
        ArrowUpIcon,
    },
};
</script>
<style lang="scss" scoped>
.bridge-page-tab {
    display: flex;
    justify-content: space-around;
    align-items: baseline;

    width: calc(100% - 260px);

    max-width: 685px;

    &__active {
        @include pageFlexColumn;
        color: var(--#{$prefix}black);
    }
}

.bridge-page__title {
    color: var(--#{$prefix}base-text);
    font-size: var(--#{$prefix}h3-fs);
    font-weight: 400;

    margin-bottom: 16px;
    text-decoration: none;

    &__active {
        color: var(--#{$prefix}primary-text);
        font-size: var(--#{$prefix}h3-fs);
        font-weight: 700;
        margin-bottom: 16px;
        text-decoration: none;
    }
}

.arrow {
    fill: var(--#{$prefix}arrow-color);
    margin-top: 10px;
}
</style>
