import { useLocalStorage } from '@vueuse/core';

import { getShortcuts, getShortcutById } from '@/core/shortcuts/api/';

const TYPES = {
    SET_FILTERED_TAGS: 'SET_FILTERED_TAGS',
    SET_WATCH_LIST: 'SET_WATCH_LIST',
    SET_SELECTED_SHORTCUT: 'SET_SELECTED_SHORTCUT',
    SET_ALL_SHORTCUTS: 'SET_ALL_SHORTCUTS',
    SET_AUTHORS_SHORTCUTS: 'SET_AUTHORS_SHORTCUTS',
    SET_SHORTCUTS_LOADING: 'SET_SHORTCUTS_LOADING',
    SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
};

const SHORTCUT_WATCH_LIST_KEY = 'shortcuts:watchList';

const shortcutWatchList = useLocalStorage(SHORTCUT_WATCH_LIST_KEY, [], { mergeDefaults: true });

const filterShortcuts = (state, type) => {
    let list = state.shortcuts;

    if (state.selectedTags.length)
        list = state.shortcuts.filter((item) => {
            return item.tags.some((tag) => state.selectedTags.includes(tag.toLowerCase()));
        });

    if (type === 'all') return list;

    return list.filter((item) => state.watchList.includes(item.id));
};

export default {
    namespaced: true,
    state: () => ({
        shortcuts: [],
        selectedTags: [],
        watchList: shortcutWatchList.value,
        selectedShortcut: null,
        moreShortcutsExists: true,
        authorsShortcuts: [],
        isShortcutsLoading: true,
        searchInput: '',
    }),
    getters: {
        shortcuts: (state) => state.shortcuts,
        selectedTags: (state) => state.selectedTags,
        watchList: (state) => state.watchList,
        selectedShortcut: (state) => state.selectedShortcut,
        searchInput: (state) => state.searchInput,
        isShortcutsLoading: (state) => state.isShortcutsLoading,
        moreShortcutsExists: (state) => state.moreShortcutsExists,
        getShortcutsByAuthor: (state) => state.authorsShortcuts,
        getShortcutsByType: (state) => (type) => filterShortcuts(state, type),
    },
    mutations: {
        [TYPES.SET_ALL_SHORTCUTS](state, value) {
            state.shortcuts = value;
        },
        [TYPES.SET_FILTERED_TAGS](state, value) {
            state.selectedTags = value;
        },
        [TYPES.SET_WATCH_LIST](state, value) {
            state.watchList = value;
        },
        [TYPES.SET_SELECTED_SHORTCUT](state, value) {
            state.selectedShortcut = value;
        },
        [TYPES.SET_AUTHORS_SHORTCUTS](state, value) {
            state.authorsShortcuts = value;
        },
        [TYPES.SET_SHORTCUTS_LOADING](state, value) {
            state.isShortcutsLoading = value;
        },
        [TYPES.SET_SEARCH_QUERY](state, value) {
            state.searchInput = value;
        },
    },
    actions: {
        setSelectedShortcut({ commit }, value) {
            commit(TYPES.SET_SELECTED_SHORTCUT, value);
        },
        setFilterTags({ state, commit }, value) {
            if (state.selectedTags.length > 5 || state.selectedTags.includes(value.toLowerCase())) return;

            commit(TYPES.SET_FILTERED_TAGS, [...state.selectedTags, value.toLowerCase()]);
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
        setShortcutsLoading({ commit }, value) {
            commit(TYPES.SET_SHORTCUTS_LOADING, value);
        },
        setSearchQuery({ commit }, value) {
            commit(TYPES.SET_SEARCH_QUERY, value);
        },
        async loadShortcutList({ state, commit }) {
            if (!state.moreShortcutsExists) return;

            commit(TYPES.SET_SHORTCUTS_LOADING, true);

            const shortcuts = await getShortcuts({ limit: 30, offset: state.shortcuts.length });

            if (!shortcuts.length) state.moreShortcutsExists = false;
            else commit(TYPES.SET_ALL_SHORTCUTS, [...state.shortcuts, ...shortcuts]);

            commit(TYPES.SET_SHORTCUTS_LOADING, false);
        },
        async loadShortcutById({ commit }, id) {
            const shortcut = await getShortcutById(id);
            commit(TYPES.SET_SELECTED_SHORTCUT, shortcut);
        },
        async loadShortcutsByAuthor({ commit }, authorId) {
            const shortcuts = await getShortcuts({ authorId });

            commit(TYPES.SET_AUTHORS_SHORTCUTS, shortcuts);
        },
        async clearAuthorsShortcuts({ commit }) {
            commit(TYPES.SET_AUTHORS_SHORTCUTS, []);
        },
        async clearShortcuts({ state, commit }) {
            state.moreShortcutsExists = true;
            commit(TYPES.SET_SHORTCUTS_LOADING, true);
            commit(TYPES.SET_ALL_SHORTCUTS, []);
        },
        async searchShortcuts({ commit }, searchString) {
            const shortcuts = await getShortcuts({ limit: 10, offset: 0, searchString });

            commit(TYPES.SET_ALL_SHORTCUTS, shortcuts);
        },
    },
};
