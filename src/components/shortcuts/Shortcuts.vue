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

    <SearchInput placeholder="Search shortcut" class="mt-16" :value="searchInput" @on-change="handleSearchChange" />

    <a-row align="middle" class="shortcut-tags">
        <div class="shortcut-tags__title">Results for:</div>

        <div v-if="!selectedTags.length" class="shortcut-tags__item type-all">
            <span>All</span>
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

    <a-row v-if="shortcutList.length" :gutter="[16, 16]" class="shortcut-list">
        <a-col v-for="(item, i) in shortcutList" :key="`shortcut-${i}`" :md="24" :lg="12">
            <ShortcutItem :item="item" />
        </a-col>
    </a-row>

    <a-empty v-else :image="emptyImage" class="shortcuts-empty" />
</template>

<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

import ShortcutItem from '@/components/shortcuts/ShortcutItem';
import SearchInput from '@/components/ui/SearchInput.vue';

import ArrowUpIcon from '@/assets/icons/module-icons/pointer-up.svg';
import ClearIcon from '@/assets/icons/form-icons/clear.svg';
import ClearAllIcon from '@/assets/icons/form-icons/remove.svg';

import { Empty } from 'ant-design-vue';

import { searchByKey } from '@/shared/utils/helpers';

import _ from 'lodash';

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

        const searchInput = ref('');

        const emptyImage = Empty.PRESENTED_IMAGE_SIMPLE;

        const shortcuts = computed(() => store.getters['shortcutsList/getShortcutsByType'](activeTabKey.value));

        const selectedTags = computed(() => store.getters['shortcutsList/selectedTags']);

        const shortcutList = ref(shortcuts.value);

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

        const handleSearchChange = (value) => {
            searchInput.value = value;

            shortcutList.value = searchShortcut(shortcuts.value, value);
        };

        const searchShortcut = (list = [], value) => {
            return _.filter(list, (elem) => searchByKey(elem, value, 'name'));
        };

        watch(shortcuts, (newShortcuts) => {
            shortcutList.value = searchShortcut(newShortcuts, searchInput.value);
        });

        return {
            shortcuts,
            selectedTags,
            tabs,
            activeTabKey,
            emptyImage,
            searchInput,
            shortcutList,

            handleSearchChange,
            onTabChange: (key) => (activeTabKey.value = key),
            removeTag,
            clearAllTags,
        };
    },
};
</script>
