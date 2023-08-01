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
        color: $colorBlack;
        font-size: 32px;
        font-family: 'Poppins_SemiBold';
        margin-bottom: 30px;
    }
}
</style>
