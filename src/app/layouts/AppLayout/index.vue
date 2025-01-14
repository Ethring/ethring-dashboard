<template>
    <LoadingOverlay v-if="isSpinning" :spinning="isSpinning" :tip="loadingTitle" />

    <a-layout has-sider>
        <NavBar />
        <SideBar />

        <a-layout class="layout main-layout">
            <a-layout-content class="content-container content main-layout-content" data-qa="content">
                <router-view v-slot="{ Component }">
                    <component :is="Component" />
                </router-view>
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>
<script>
import { computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

import LoadingOverlay from '@/components/ui/LoadingOverlay';

import NavBar from './header/NavBar.vue';
import SideBar from '@/app/layouts/AppLayout/sidebar/Sidebar.vue';

export default {
    name: 'DefaultLayout',
    components: {
        NavBar,

        SideBar,
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
