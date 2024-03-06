import { useLocalStorage } from '@vueuse/core';

import { SHORTCUTS } from '@/config/shortcutList';

const TYPES = {
    SET_FILTERED_TAGS: 'SET_FILTERED_TAGS',
    SET_WATCHLIST: 'SET_WATCHLIST',
    SET_SELECTED_SHORTCUT: 'SET_SELECTED_SHORTCUT',
};

const SHORTCUT_WATCHLIST_KEY = 'shortcuts:watchlist';

const shortcutWatchList = useLocalStorage(SHORTCUT_WATCHLIST_KEY, [], { mergeDefaults: true });

export default {
    namespaced: true,
    state: () => ({
        shortcuts: SHORTCUTS,
        selectedTags: [],
        watchList: shortcutWatchList.value,
        selectedShortcut: {},
    }),
    getters: {
        shortcuts: (state) => state.shortcuts,
        selectedTags: (state) => state.selectedTags,
        watchList: (state) => state.watchList,
        selectedShortcut: (state) => state.selectedShortcut,

        getShortcutsByType: (state) => (type) =>
            type === 'all' ? state.shortcuts : state.shortcuts.filter((item) => state.watchList.includes(item.id)),
    },
    mutations: {
        [TYPES.SET_FILTERED_TAGS](state, value) {
            state.selectedTags = value;
        },
        [TYPES.SET_WATCHLIST](state, value) {
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
        setFilterTags({ commit }, value) {
            // TODO
            commit(TYPES.SET_FILTERED_TAGS, value);
        },
        setWatchlist({ commit }, value) {
            if (shortcutWatchList.value.includes(value)) {
                shortcutWatchList.value = shortcutWatchList.value.filter((item) => item !== value);
            } else {
                shortcutWatchList.value = [...shortcutWatchList.value, value];
            }

            commit(TYPES.SET_WATCHLIST, shortcutWatchList.value);
        },
    },
};
