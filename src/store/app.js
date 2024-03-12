const STORAGE = {
    SHOW_BALANCE: 'user-settings:show-balances',
    COLLAPSED_SIDEBAR: 'user-settings:sidebar-collapsed',
    THEME: 'theme',
    LAST_VERSION: 'lastVersion',
};

const VERSION_LOCAL = window.localStorage.getItem(STORAGE.LAST_VERSION);
const APP_THEME = window.localStorage.getItem(STORAGE.THEME);
const SHOW_BALANCE = JSON.parse(window.localStorage.getItem(STORAGE.SHOW_BALANCE));
const COLLAPSED_SIDEBAR = JSON.parse(window.localStorage.getItem(STORAGE.COLLAPSED_SIDEBAR));

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
};

export default {
    namespaced: true,

    state: () => ({
        showBalance: SHOW_BALANCE ?? true,
        collapse: COLLAPSED_SIDEBAR ?? false,
        theme: APP_THEME || 'light',
        selectedKeys: ['main'],
        loadingTokenList: false,
        modals: {
            buyCrypto: false,
            releaseNotes: false,
            selectModal: false,
            routesModal: false,
        },
        selectModal: {
            type: 'network',
            isOpen: false,
            module: null,
        },
        lastVersion: VERSION_LOCAL ? VERSION_LOCAL : '0.1.0',
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
    },

    mutations: {
        [TYPES.TOGGLE_VIEW_BALANCE](state) {
            state.showBalance = !state.showBalance;
            window.localStorage.setItem(STORAGE.SHOW_BALANCE, state.showBalance);
        },
        [TYPES.TOGGLE_SIDEBAR](state) {
            state.collapse = !state.collapse;
            window.localStorage.setItem(STORAGE.COLLAPSED_SIDEBAR, state.collapse);
        },
        [TYPES.SET_IS_SIDEBAR_COLLAPSED](state, value) {
            state.collapse = value;
            window.localStorage.setItem(STORAGE.COLLAPSED_SIDEBAR, value);
        },
        [TYPES.TOGGLE_THEME](state) {
            state.theme = state.theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
            document.documentElement.setAttribute('data-theme', state.theme);
            window.localStorage.setItem(STORAGE.THEME, state.theme);
        },
        [TYPES.SET_SELECTED_KEYS](state, selectedKeys) {
            state.selectedKeys = selectedKeys;
        },
        [TYPES.TOGGLE_MODAL](state, modalName) {
            if (!state.modals[modalName]) {
                state.modals[modalName] = false;
            }
            state.modals[modalName] = !state.modals[modalName];
        },
        [TYPES.TOGGLE_SELECT_MODAL](state, { type, module }) {
            state.selectModal.type = type;
            state.selectModal.module = module;
            state.selectModal.isOpen = !state.selectModal.isOpen;
        },
        [TYPES.SET_LAST_VERSION](state, version) {
            state.lastVersion = version;
            window.localStorage.setItem(STORAGE.LAST_VERSION, version);
        },
        [TYPES.SET_LOADING_TOKEN_LIST](state, value) {
            state.loadingTokenList = value || false;
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
    },
};
