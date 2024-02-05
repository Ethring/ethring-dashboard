const VERSION_LOCAL = window.localStorage.getItem('lastVersion');

const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
};

const types = {
    TOGGLE_VIEW_BALANCE: 'TOGGLE_VIEW_BALANCE',
    TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
    SET_IS_SIDEBAR_COLLAPSED: 'SET_IS_SIDEBAR_COLLAPSED',
    TOGGLE_THEME: 'TOGGLE_THEME',
    TOGGLE_MODAL: 'TOGGLE_MODAL',
    TOGGLE_SELECT_MODAL: 'TOGGLE_SELECT_MODAL',
    SET_SELECTED_KEYS: 'SET_SELECTED_KEYS',
    SET_LAST_VERSION: 'SET_LAST_VERSION',
};

export default {
    namespaced: true,

    state: () => ({
        showBalance: true,
        collapse: false,
        theme: 'light',
        selectedKeys: ['main'],
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
    },

    mutations: {
        [types.TOGGLE_VIEW_BALANCE](state) {
            state.showBalance = !state.showBalance;
        },
        [types.TOGGLE_SIDEBAR](state) {
            state.collapse = !state.collapse;
        },
        [types.SET_IS_SIDEBAR_COLLAPSED](state, value) {
            state.collapse = value;
        },
        [types.TOGGLE_THEME](state) {
            state.theme = state.theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
            document.documentElement.setAttribute('data-theme', state.theme);
        },
        [types.SET_SELECTED_KEYS](state, selectedKeys) {
            state.selectedKeys = selectedKeys;
        },
        [types.TOGGLE_MODAL](state, modalName) {
            if (!state.modals[modalName]) {
                state.modals[modalName] = false;
            }

            state.modals[modalName] = !state.modals[modalName];
        },
        [types.TOGGLE_SELECT_MODAL](state, { type, module }) {
            state.selectModal.type = type;
            state.selectModal.module = module;
            state.selectModal.isOpen = !state.selectModal.isOpen;
        },
        [types.SET_LAST_VERSION](state, version) {
            state.lastVersion = version;
            window.localStorage.setItem('lastVersion', version);
        },
    },

    actions: {
        toggleViewBalance({ commit }) {
            commit(types.TOGGLE_VIEW_BALANCE);
        },
        toggleSidebar({ commit }) {
            commit(types.TOGGLE_SIDEBAR);
        },
        setIsCollapsed({ commit }, value) {
            commit(types.SET_IS_SIDEBAR_COLLAPSED, value);
        },
        toggleTheme({ commit }) {
            commit(types.TOGGLE_THEME);
        },
        setSelectedKey({ commit }, selectedKeys) {
            commit(types.SET_SELECTED_KEYS, selectedKeys);
        },
        toggleModal({ commit }, modalName) {
            commit(types.TOGGLE_MODAL, modalName);
        },
        toggleSelectModal({ commit }, value) {
            commit(types.TOGGLE_SELECT_MODAL, value);
        },
        toggleReleaseNotes({ commit }) {
            commit(types.TOGGLE_MODAL, 'releaseNotes');
        },
        setLastVersion({ commit }, version) {
            commit(types.SET_LAST_VERSION, version);
        },
    },
};
