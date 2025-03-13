import { useLocalStorage } from '@vueuse/core';

const STORAGE = {
    SHOW_BALANCE: 'user-settings:show-balances',
    COLLAPSED_SIDEBAR: 'user-settings:sidebar-collapsed',
    THEME: 'theme',
    LAST_VERSION: 'lastVersion',
    COLLAPSED_ASSETS: 'user-settings:collapsable-assets',
};

const appThemeStorage = useLocalStorage(STORAGE.THEME, 'light', { mergeDefaults: true });
const showBalanceStorage = useLocalStorage(STORAGE.SHOW_BALANCE, true, { mergeDefaults: true });
const appVersionStorage = useLocalStorage(STORAGE.LAST_VERSION, process.env.APP_VERSION || '0.1.0', { mergeDefaults: true });
const collapsedSidebarStorage = useLocalStorage(STORAGE.COLLAPSED_SIDEBAR, false, { mergeDefaults: true });
const collapsedAssetsStorage = useLocalStorage(STORAGE.COLLAPSED_ASSETS, [], { mergeDefaults: true });

const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
};

const TYPES = {
    TOGGLE_VIEW_BALANCE: 'TOGGLE_VIEW_BALANCE',
    TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
    SET_IS_SIDEBAR_COLLAPSED: 'SET_IS_SIDEBAR_COLLAPSED',
    TOGGLE_THEME: 'TOGGLE_THEME',
    TOGGLE_MODAL: 'TOGGLE_MODAL',
    TOGGLE_SELECT_MODAL: 'TOGGLE_SELECT_MODAL',
    SET_SELECTED_KEYS: 'SET_SELECTED_KEYS',
    SET_LAST_VERSION: 'SET_LAST_VERSION',
    SET_LOADING_TOKEN_LIST: 'SET_LOADING_TOKEN_LIST',
    SET_COLLAPSED_ACTIVE_KEY: 'SET_COLLAPSED_ACTIVE_KEY',
};

export default {
    namespaced: true,

    state: () => ({
        showBalance: showBalanceStorage.value,
        collapse: collapsedSidebarStorage.value,
        theme: appThemeStorage.value,
        selectedKeys: ['main'],
        loadingTokenList: false,
        modals: {
            buyCrypto: false,
            releaseNotes: false,
            selectModal: false,
            routesModal: false,
            socialShare: false,
            settingsModal: false,
            filtersModal: false,
        },
        selectModal: {
            type: 'network',
            isOpen: false,
            module: null,
            direction: 'SOURCE',
        },
        lastVersion: appVersionStorage.value,
        collapsedAssets: collapsedAssetsStorage.value || [],
    }),

    getters: {
        showBalance: (state) => state.showBalance,
        isCollapsed: (state) => state.collapse,
        theme: (state) => state.theme,
        selectedKeys: (state) => state.selectedKeys,
        modal: (state) => (modalName) => state.modals[modalName] || false,
        selectModal: (state) => state.selectModal,
        lastVersion: (state) => state.lastVersion || '0.1.0',
        isLoadingTokenList: (state) => state.loadingTokenList || false,
        collapsedAssets: (state) => state.collapsedAssets || [],
    },

    mutations: {
        [TYPES.TOGGLE_VIEW_BALANCE](state) {
            state.showBalance = !state.showBalance;
            showBalanceStorage.value = state.showBalance;
        },
        [TYPES.TOGGLE_SIDEBAR](state) {
            state.collapse = !state.collapse;
            collapsedSidebarStorage.value = state.collapse;
        },
        [TYPES.SET_IS_SIDEBAR_COLLAPSED](state, value) {
            state.collapse = value;
            collapsedSidebarStorage.value = value;
        },
        [TYPES.TOGGLE_THEME](state) {
            state.theme = state.theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
            document.documentElement.setAttribute('data-theme', state.theme);
            appThemeStorage.value = state.theme;
        },
        [TYPES.SET_SELECTED_KEYS](state, selectedKeys) {
            state.selectedKeys = selectedKeys;
        },
        [TYPES.TOGGLE_MODAL](state, modalName) {
            if (!state.modals[modalName]) state.modals[modalName] = false;

            state.modals[modalName] = !state.modals[modalName];
        },
        [TYPES.TOGGLE_SELECT_MODAL](state, { type, module, direction }) {
            state.selectModal.type = type;
            state.selectModal.module = module;
            state.selectModal.isOpen = !state.selectModal.isOpen;
            state.selectModal.direction = direction;
        },
        [TYPES.SET_LAST_VERSION](state, version) {
            state.lastVersion = version;
            appVersionStorage.value = version;
        },
        [TYPES.SET_LOADING_TOKEN_LIST](state, value) {
            state.loadingTokenList = value || false;
        },
        [TYPES.SET_COLLAPSED_ACTIVE_KEY](state, value) {
            state.collapsedAssets = value;
            collapsedAssetsStorage.value = value;
        },
    },

    actions: {
        toggleViewBalance({ commit }) {
            commit(TYPES.TOGGLE_VIEW_BALANCE);
        },
        toggleSidebar({ commit }) {
            commit(TYPES.TOGGLE_SIDEBAR);
        },
        setIsCollapsed({ commit }, value) {
            commit(TYPES.SET_IS_SIDEBAR_COLLAPSED, value);
        },
        toggleTheme({ commit }) {
            commit(TYPES.TOGGLE_THEME);
        },
        setSelectedKey({ commit }, selectedKeys) {
            commit(TYPES.SET_SELECTED_KEYS, selectedKeys);
        },
        toggleModal({ commit }, modalName) {
            commit(TYPES.TOGGLE_MODAL, modalName);
        },
        toggleSelectModal({ commit }, value) {
            commit(TYPES.TOGGLE_SELECT_MODAL, value);
        },
        toggleReleaseNotes({ commit }) {
            commit(TYPES.TOGGLE_MODAL, 'releaseNotes');
        },
        setLastVersion({ commit }, version) {
            commit(TYPES.SET_LAST_VERSION, version);
        },
        setLoadingTokenList({ commit }, value) {
            commit(TYPES.SET_LOADING_TOKEN_LIST, value);
        },
        setCollapsedAssets({ commit }, value) {
            commit(TYPES.SET_COLLAPSED_ACTIVE_KEY, value);
        },
    },
};
