const TYPES = {
    SET_ECOSYSTEM_ADAPTER: 'SET_ECOSYSTEM_ADAPTER',
    SET_WALLETS_MODULE: 'SET_WALLETS_MODULE',
    SET_WALLET: 'SET_WALLET',
    DISCONNECT_ALL_WALLETS: 'DISCONNECT_ALL_WALLETS',

    SET_ECOSYSTEM: 'SET_ECOSYSTEM',

    SET_MODAL_STATE: 'SET_MODAL_STATE',
};

const cached = window.localStorage.getItem('adapter:connectedWallets');
const connectedWallets = cached ? JSON.parse(cached) : [];

function findKeyDifferences(oldRecord, newRecord) {
    return Object.keys(oldRecord)
        .concat(Object.keys(newRecord))
        .filter((key) => oldRecord[key] !== newRecord[key]);
}

export default {
    namespaced: true,

    state: () => ({
        isOpen: false,
        ecosystem: null,
        adapters: {},
        wallets: connectedWallets,
        walletsModule: [],
    }),

    getters: {
        isOpen: (state) => state.isOpen,
        getEcosystem: (state) => state.ecosystem,
        getAdapterByEcosystem: (state) => (ecosystem) => state.adapters[ecosystem] || null,
        getWalletsModule: (state) => state.walletsModule,
        getWallets: (state) => state.wallets,
    },

    mutations: {
        [TYPES.SET_MODAL_STATE](state, value) {
            state.isOpen = value;
        },
        [TYPES.SET_ECOSYSTEM](state, value) {
            state.ecosystem = value;
        },
        [TYPES.SET_ECOSYSTEM_ADAPTER](state, value) {
            if (value?.ecosystem) {
                state.adapters[value.ecosystem] = value.adapter;
            }
        },
        [TYPES.SET_WALLETS_MODULE](state, value) {
            state.walletsModule = value;
        },
        [TYPES.SET_WALLET](state, value) {
            window.localStorage.setItem('adapter:lastConnectedWallet', JSON.stringify(value));

            const found = state.wallets.filter((wallet) => wallet.account === value.account);
            const [exist] = found;

            if (!exist) {
                state.wallets.push(value);
                return window.localStorage.setItem('adapter:connectedWallets', JSON.stringify(state.wallets));
            }

            findKeyDifferences(exist, value).forEach((key) => {
                exist[key] = value[key];
            });

            return window.localStorage.setItem('adapter:connectedWallets', JSON.stringify(state.wallets));
        },
        [TYPES.DISCONNECT_ALL_WALLETS](state) {
            state.wallets = [];
            window.localStorage.removeItem('adapter:connectedWallets');
            window.localStorage.removeItem('adapter:lastConnectedWallet');
        },
    },

    actions: {
        open({ commit }) {
            commit(TYPES.SET_MODAL_STATE, true);
        },
        close({ commit }) {
            commit(TYPES.SET_MODAL_STATE, false);
        },
        setEcosystem({ commit }, value) {
            commit(TYPES.SET_ECOSYSTEM, value);
        },
        setAdapter({ commit }, value) {
            commit(TYPES.SET_ECOSYSTEM_ADAPTER, value);
        },
        setWallet({ commit }, value) {
            commit(TYPES.SET_WALLET, value);
            commit(TYPES.SET_ECOSYSTEM, value.ecosystem);
        },
        disconnectAll({ commit }) {
            commit(TYPES.DISCONNECT_ALL_WALLETS);
        },
        setWalletsModule({ commit }, value) {
            commit(TYPES.SET_WALLETS_MODULE, value);
        },
    },
};
