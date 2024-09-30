<template>
    <a-layout-sider
        v-model:collapsed="isCollapsed"
        class="sidebar-container"
        breakpoint="xl"
        collapsible
        :trigger="null"
        :width="isCollapsed ? '64px' : '240px'"
        collapsed-width="64px"
    >
        <div>
            <SidebarLogo :collapsed="isCollapsed" @click="() => onClickSidebarItem({ disabled: false, to: '/' })" />

            <a-menu v-model:selectedKeys="selectedKeys" mode="inline" class="sidebar__menu">
                <SidebarItem
                    v-for="item in menu"
                    :key="item.key"
                    v-bind="item"
                    :menu-key="item.key"
                    :data-qa="`sidebar-item-${item.key}`"
                    @click="() => onClickSidebarItem(item)"
                />
            </a-menu>
        </div>

        <div>
            <a-menu mode="inline" class="sidebar__menu">
                <SidebarItem
                    menu-key="menu-link"
                    :title="$t(`sidebar.feedback`)"
                    icon="feedbackIcon"
                    type="link"
                    link="https://forms.gle/AvMY8vdChmvHM45RA"
                />
            </a-menu>

            <SidebarFooter />
        </div>

        <SidebarTrigger />
    </a-layout-sider>
</template>
<script>
import { computed, inject, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import UIConfig from '@/config/ui';

import SidebarItem from './SidebarItem.vue';
import SidebarLogo from './SidebarLogo.vue';
import SidebarTrigger from './SidebarTrigger.vue';
import SidebarFooter from './SidebarFooter.vue';

export default {
    name: 'Sidebar',
    components: {
        SidebarItem,
        SidebarLogo,

        SidebarTrigger,
        SidebarFooter,
    },
    setup() {
        const store = useStore();
        const router = useRouter();

        const isCollapsed = computed({
            get: () => store.getters['app/isCollapsed'],
            set: (value) => store.dispatch('app/setIsCollapsed', value),
        });

        const selectedKeys = computed({
            get: () => store.getters['app/selectedKeys'],
            set: (value) => store.dispatch('app/setSelectedKey', value),
        });

        const useAdapter = inject('useAdapter');

        const { walletAddress, currentChainInfo } = useAdapter();

        const IS_COLLAPSED_KEY = 'user-settings:sidebar-collapsed';

        const menu = computed(() => {
            const config = UIConfig(currentChainInfo.value?.net, currentChainInfo.value?.ecosystem);

            if (!config) return [];

            return config.sidebar;
        });

        const onClickSidebarItem = (item) => {
            if (item.disabled) return;

            return router.push(item.to);
        };

        watch(
            () => router.currentRoute.value.path,
            () => {
                selectedKeys.value = [router.currentRoute.value.meta?.key];
            },
        );

        onMounted(() => {
            const isCollapsedStorage = JSON.parse(localStorage.getItem(IS_COLLAPSED_KEY));

            if (isCollapsedStorage) isCollapsed.value = isCollapsedStorage;
        });

        return {
            menu,
            isCollapsed,
            selectedKeys,

            onClickSidebarItem,

            walletAddress,
        };
    },
};
</script>
