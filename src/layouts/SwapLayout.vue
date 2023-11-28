<template>
    <AppLayout component="swap">
        <div class="swap-page__title">{{ $t('simpleSwap.title') }}</div>
    </AppLayout>
</template>
<script>
import AppLayout from '@/layouts/AppLayout.vue';

export default {
    name: 'Swap',
    components: {
        AppLayout,
    },
};
</script>
<style lang="scss" scoped>
.swap-page {
    &__title {
        color: var(--#{$prefix}primary-text);
        font-size: var(--#{$prefix}h3-fs);
        font-weight: 700;
        margin-bottom: 24px;
    }
}
</style>
