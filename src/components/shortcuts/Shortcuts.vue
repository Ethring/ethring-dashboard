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

    <SearchInput
        placeholder="Search shortcut"
        class="mt-16"
        :value="searchInput"
        @on-change="handleSearchChange"
        @on-clear="handleSearchClear"
    />

    <a-row align="middle" class="shortcut-tags">
        <div class="shortcut-tags__title">Results for:</div>

        <div v-if="!selectedTags.length" class="shortcut-tags__item type-all">
            <span>All: {{ shortcuts.length }}</span>
        </div>

        <div v-for="tag in selectedTags" :key="tag" class="shortcut-tags__item">
            <span>{{ tag }}</span>
            <ClearIcon @click="() => removeTag(tag)" />
        </div>

        <div v-if="selectedTags.length" class="shortcut-tags__clear" @click="clearAllTags">
            <ClearAllIcon />
            <span>{{ $t('shortcuts.clearAll') }}</span>
        </div>
    </a-row>

    <div v-if="shortcuts.length" class="shortcut-list">
        <a-row :gutter="[16, 16]">
            <a-col v-for="(item, i) in shortcuts" :key="`shortcut-${i}`" :md="24" :lg="12"> <ShortcutItem :item="item" /> </a-col
        ></a-row>
        <a-spin v-if="isShortcutsLoading" size="medium" class="spin__center mt-16" />
    </div>

    <a-spin v-else-if="isShortcutsLoading" size="large" class="spin__center" />

    <a-empty v-else class="shortcuts-empty" />
</template>

<script>
import { computed, ref, onBeforeMount, onUnmounted } from 'vue';
import { useStore } from 'vuex';

import ShortcutItem from '@/components/shortcuts/ShortcutItem';
import SearchInput from '@/components/ui/SearchInput.vue';

import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';
import ClearIcon from '@/assets/icons/form-icons/clear.svg';
import ClearAllIcon from '@/assets/icons/form-icons/remove.svg';

import { Empty } from 'ant-design-vue';

export default {
    name: 'Shortcuts',
    components: {
        ShortcutItem,
        SearchInput,

        ArrowUpIcon,
        ClearIcon,
        ClearAllIcon,
    },
    setup() {
        const store = useStore();

        const activeTabKey = ref('all');

        const emptyImage = Empty.PRESENTED_IMAGE_SIMPLE;

        const shortcuts = computed(() => store.getters['shortcutsList/getShortcutsByType'](activeTabKey.value));

        const selectedTags = computed(() => store.getters['shortcutsList/selectedTags']);

        const moreShortcutsExists = computed(() => store.getters['shortcutsList/moreShortcutsExists']);

        const isShortcutsLoading = computed({
            get: () => store.getters['shortcutsList/isShortcutsLoading'],
            set: (value) => store.dispatch('shortcutsList/setShortcutsLoading', value),
        });

        const searchInput = computed({
            get: () => store.getters['shortcutsList/searchInput'],
            set: (value) => store.dispatch('shortcutsList/setSearchQuery', value),
        });

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

        const removeTag = (tag) => {
            store.dispatch('shortcutsList/removeFilterTag', tag);
        };

        const clearAllTags = () => {
            store.dispatch('shortcutsList/clearAllTags');
        };

        const handleSearchChange = async (value) => {
            searchInput.value = value.trim();

            await store.dispatch('shortcutsList/searchShortcuts', searchInput.value);
        };

        const handleSearchClear = async () => {
            await store.dispatch('shortcutsList/loadShortcutList');
        };

        const handleScroll = async () => {
            if (searchInput.value.length || isShortcutsLoading.value) return;

            if (window.scrollY + window.screenTop > window.screen.height * Math.floor(shortcuts.value.length / 10))
                await store.dispatch('shortcutsList/loadShortcutList');
        };

        onBeforeMount(async () => {
            await store.dispatch('shortcutsList/loadShortcutList');
        });

        return {
            shortcuts,
            selectedTags,
            tabs,
            activeTabKey,
            emptyImage,
            searchInput,
            isShortcutsLoading,

            handleSearchChange,
            handleSearchClear,
            onTabChange: (key) => (activeTabKey.value = key),
            removeTag,
            clearAllTags,
        };
    },
};
</script>
