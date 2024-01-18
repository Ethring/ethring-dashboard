<template>
    <a-layout-sider
        class="sidebar-container"
        v-model:collapsed="isCollapsed"
        breakpoint="xl"
        collapsible
        :trigger="null"
        :width="isCollapsed ? '64px' : '240px'"
        collapsedWidth="64px"
    >
        <div>
            <SidebarLogo :collapsed="isCollapsed" @click="() => onClickSidebarItem({ disabled: false, to: '/' })" />

            <a-menu mode="inline" class="sidebar__menu" v-if="walletAddress" v-model:selectedKeys="selectedKeys">
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
                <SidebarItem key="menu-settings" :title="$t(`sidebar.settings`)" icon="SettingsIcon" disabled />
            </a-menu>

            <SidebarFooter />
        </div>

        <SidebarTrigger />
    </a-layout-sider>
</template>
<script>
import { computed, inject, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import UIConfig from '../../../config/ui';

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

        const { walletAddress } = useAdapter();

        const { currentChainInfo } = useAdapter();

        const menu = computed(() => {
            if (!currentChainInfo.value?.ecosystem) {
                return [];
            }

            const config = UIConfig(currentChainInfo.value?.net, currentChainInfo.value?.ecosystem);

            if (!config) {
                return [];
            }

            return config.sidebar;
        });

        const onClickSidebarItem = (item) => {
            if (item.disabled) {
                return;
            }

            if (item.type === 'modal') {
                return store.dispatch('app/toggleModal', item.key);
            }

            return router.push(item.to);
        };

        watch(
            () => router.currentRoute.value.path,
            () => {
                selectedKeys.value = [router.currentRoute.value.meta?.key];
            }
        );

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
