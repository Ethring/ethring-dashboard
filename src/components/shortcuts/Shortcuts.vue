<template>
    <a-row class="shortcut-tabs">
        <div
            v-for="tab in tabs"
            :key="tab.key"
            class="shortcuts-tab-item"
            :class="{ 'shortcuts-tab-active': activeTabKey === tab.key }"
            @click="onTabChange(tab.key)"
        >
            {{ tab.tab }}
            <ArrowUpIcon v-if="activeTabKey === tab.key" />
        </div>
    </a-row>

    <a-row :gutter="[16, 16]" v-if="shortcuts.length" class="shortcut-list">
        <a-col v-for="(item, i) in shortcuts" :key="`shortcut-${i}`" :md="24" :lg="12">
            <ShortcutItem :item="item" />
        </a-col>
    </a-row>
    <a-empty v-else :image="emptyImage" class="shortcuts-empty" />
</template>

<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import ShortcutItem from '@/components/shortcuts/ShortcutItem';

import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';

import { Empty } from 'ant-design-vue';

export default {
    name: 'Shortcuts',
    components: {
        ShortcutItem,
        ArrowUpIcon,
    },
    setup() {
        const store = useStore();

        const activeTabKey = ref('all');

        const emptyImage = Empty.PRESENTED_IMAGE_SIMPLE;

        const shortcuts = computed(() => store.getters['shortcuts/getShortcutsByType'](activeTabKey.value));

        const tabs = ref([
            {
                key: 'all',
                tab: 'All shortcuts',
            },
            {
                key: 'watchlist',
                tab: 'Watchlist',
            },
        ]);

        return {
            shortcuts,
            tabs,
            activeTabKey,
            emptyImage,

            onTabChange: (key) => (activeTabKey.value = key),
        };
    },
};
</script>
