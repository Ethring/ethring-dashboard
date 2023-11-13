<template>
    <AppLayout component="superSwap">
        <div class="superswap-page__title">{{ $t('superSwap.title') }}</div>
    </AppLayout>
</template>
<script>
import AppLayout from '@/layouts/AppLayout.vue';

export default {
    name: 'SuperSwap',
    components: {
        AppLayout,
    },
    setup() {
        return {};
    },
};
</script>
<style lang="scss" scoped>
.superswap-page__title {
    color: var(--#{$prefix}primary-text);
    font-size: var(--#{$prefix}h3-fs);
    font-weight: 600;
    margin-bottom: 18px;
    margin-left: -515px;
    text-decoration: none;
}
</style>
