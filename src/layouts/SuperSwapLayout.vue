<template>
    <AppLayout component="superSwap">
        <div class="superswap-page__title">{{ $t('superSwap.title') }}</div>
    </AppLayout>
    <RoutesModal v-if="showRoutesModal" @close="closeRoutesModal" />
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import AppLayout from '@/layouts/AppLayout.vue';
import RoutesModal from '@/components/app/modals/RoutesModal';

export default {
    name: 'SuperSwap',
    components: {
        AppLayout,
        RoutesModal,
    },
    setup() {
        const store = useStore();
        const showRoutesModal = computed(() => store.getters['swap/showRoutes']);

        const closeRoutesModal = () => {
            store.dispatch('swap/setShowRoutes', false);
        };

        return {
            showRoutesModal,
            closeRoutesModal,
        };
    },
};
</script>
<style lang="scss" scoped>
.superswap-page__title {
    color: var(--#{$prefix}primary-text);
    font-size: var(--#{$prefix}h1-fs);
    font-weight: 600;
    margin-bottom: 30px;
    text-decoration: none;
}

.arrow {
    fill: var(--#{$prefix}arrow-color);
}
</style>
