<template>
    <LoadingOverlay v-if="isSpinning" :spinning="isSpinning" :tip="loadingTitle" />

    <a-layout>
        <NavBar />

        <a-layout class="layout main-layout">
            <a-layout-content class="content-container content main-layout-content" data-qa="content">
                <router-view v-slot="{ Component }">
                    <component :is="Component" />
                </router-view>
            </a-layout-content>

            <a-layout-footer class="footer">
                <AppFooter />
            </a-layout-footer>
        </a-layout>
    </a-layout>
</template>
<script>
import { computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

import LoadingOverlay from '@/components/ui/LoadingOverlay';

import NavBar from './header/NavBar.vue';
import AppFooter from '@/app/layouts/AppLayout/footer/index.vue';

export default {
    name: 'DefaultLayout',
    components: {
        NavBar,

        AppFooter,
        LoadingOverlay,
    },

    setup() {
        const store = useStore();

        const useAdapter = inject('useAdapter');
        const { isConnecting } = useAdapter();

        const isCollapsed = computed(() => store.getters['app/isCollapsed']);
        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const isSpinning = computed(() => isConfigLoading.value || isConnecting.value || false);

        const loadingTitle = computed(() => {
            if (isConfigLoading.value) return 'loadings.initLoading';

            if (isConnecting.value) return 'loadings.walletConnecting';

            return '';
        });

        onMounted(() => {
            if (!window.localStorage?.getItem('lastVersion')) store.dispatch('app/setLastVersion', process.env.APP_VERSION);
        });

        return {
            isSpinning,
            isCollapsed,

            loadingTitle,
        };
    },
};
</script>
