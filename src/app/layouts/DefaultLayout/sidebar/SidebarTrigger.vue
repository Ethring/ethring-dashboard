<template>
    <div class="trigger sidebar-trigger" @click="toggleCollapsed">
        <MenuIcon :class="{ 'sidebar-trigger__closed': !isCollapsed }" />
    </div>
</template>
<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

import MenuIcon from '@/assets/icons/sidebar/arrow-open.svg';

export default {
    name: 'SidebarTrigger',
    components: {
        MenuIcon,
    },
    setup() {
        const store = useStore();

        const isCollapsed = computed({
            get: () => store.getters['app/isCollapsed'],
            set: () => store.dispatch('app/toggleSidebar'),
        });

        const toggleCollapsed = () => (isCollapsed.value = !isCollapsed.value);

        return {
            isCollapsed,
            toggleCollapsed,
        };
    },
};
</script>
