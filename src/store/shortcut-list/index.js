import { useLocalStorage } from '@vueuse/core';

import { getAllShortcuts, getDataByIdAndType } from '@/core/shortcuts/data';

const TYPES = {
    SET_FILTERED_TAGS: 'SET_FILTERED_TAGS',
    SET_WATCH_LIST: 'SET_WATCH_LIST',
    SET_SELECTED_SHORTCUT: 'SET_SELECTED_SHORTCUT',
};

const SHORTCUT_WATCH_LIST_KEY = 'shortcuts:watchList';

const shortcutWatchList = useLocalStorage(SHORTCUT_WATCH_LIST_KEY, [], { mergeDefaults: true });

const filterShortcuts = (state, type) => {
    let list = state.shortcuts;

    if (state.selectedTags.length)
        list = state.shortcuts.filter((item) => {
            return item.tags.some((tag) => state.selectedTags.includes(tag));
        });

    if (type === 'all') return list;

    return list.filter((item) => state.watchList.includes(item.id));
};

export default {
    namespaced: true,
    state: () => ({
        shortcuts: getAllShortcuts('META'),
        selectedTags: [],
        watchList: shortcutWatchList.value,
        selectedShortcut: null,
    }),
    getters: {
        shortcuts: (state) => state.shortcuts,
        selectedTags: (state) => state.selectedTags,
        watchList: (state) => state.watchList,
        selectedShortcut: (state) => state.selectedShortcut,
        getShortcutById: (state) => (id) => getDataByIdAndType(id, 'ALL'),
        getAuthorById: (state) => (id) => getDataByIdAndType(id, 'AUTHOR'),
        getShortcutsByAuthor: (state) => (author, type) =>
            filterShortcuts(state, type || 'all').filter((item) => item.author.id === author),

        getCreatedShortcutsCount: (state) => (author) => filterShortcuts(state, 'all').filter((item) => item.author.id === author).length,
        getShortcutsByType: (state) => (type) => filterShortcuts(state, type),
    },
    mutations: {
        [TYPES.SET_FILTERED_TAGS](state, value) {
            state.selectedTags = value;
        },
        [TYPES.SET_WATCH_LIST](state, value) {
            state.watchList = value;
        },
        [TYPES.SET_SELECTED_SHORTCUT](state, value) {
            state.selectedShortcut = value;
        },
    },
    actions: {
        setSelectedShortcut({ commit }, value) {
            commit(TYPES.SET_SELECTED_SHORTCUT, value);
        },
        setFilterTags({ state, commit }, value) {
            if (state.selectedTags.length > 5 || state.selectedTags.includes(value)) return;

            commit(TYPES.SET_FILTERED_TAGS, [...state.selectedTags, value]);
        },
        removeFilterTag({ state, commit }, value) {
            const temp = state.selectedTags.filter((item) => item !== value);

            commit(TYPES.SET_FILTERED_TAGS, temp);
        },
        clearAllTags({ commit }) {
            commit(TYPES.SET_FILTERED_TAGS, []);
        },
        setWatchList({ commit }, value) {
            if (shortcutWatchList.value.includes(value)) shortcutWatchList.value = shortcutWatchList.value.filter((item) => item !== value);
            else shortcutWatchList.value = [...shortcutWatchList.value, value];

            commit(TYPES.SET_WATCH_LIST, shortcutWatchList.value);
        },
    },
};
