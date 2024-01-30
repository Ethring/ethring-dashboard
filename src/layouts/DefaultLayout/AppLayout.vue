<template>
    <LoadingOverlay v-if="isSpinning" :spinning="isSpinning" :tip="loadingTitle" />

    <a-layout has-sider>
        <Sidebar />

        <a-layout class="layout main-layout" :class="{ collapsed: isCollapsed }">
            <NavBar />
            <a-layout-content class="content main-layout-content" data-qa="content">
                <router-view />
            </a-layout-content>
        </a-layout>
    </a-layout>
</template>
<script>
import { computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

import LoadingOverlay from '@/components/ui/LoadingOverlay';

import Sidebar from './sidebar/MainSidebar.vue';
import NavBar from './header/NavBar.vue';

export default {
    name: 'AppLayout',
    components: {
        Sidebar,
        NavBar,
        LoadingOverlay,
    },

    setup() {
        const store = useStore();

        const useAdapter = inject('useAdapter');
        const { isConnecting } = useAdapter();

        const isCollapsed = computed(() => store.getters['app/isCollapsed']);
        const isConfigLoading = computed(() => store.getters['networks/isConfigLoading']);

        const isSpinning = computed(() => isConfigLoading.value || isConnecting.value);

        const loadingTitle = computed(() => {
            if (isConfigLoading.value) {
                return 'dashboard.loadingConfig';
            }

            if (isConnecting.value) {
                return 'dashboard.connecting';
            }

            return '';
        });

        onMounted(() => {
            if (!window.localStorage?.getItem('lastVersion')) {
                store.dispatch('app/setLastVersion', import.meta.env.VITE_APP_VERSION);
            }
        });

        return {
            isSpinning,
            isCollapsed,

            loadingTitle,
        };
    },
};
</script>

<style lang="scss" scoped>
.app-wrap.lock-scroll {
    overflow: hidden;
}

.sidebar {
    background: var(--zmt-primary);
}

.header {
    width: 75%;
    margin: 0 auto;

    height: 48px;
    padding: 0;

    position: sticky;
    top: 0;
    z-index: 100;

    background-color: var(--#{$prefix}nav-bar-bg-color);
}
</style>
