import Adapters from '@/Adapter';
import { ECOSYSTEMS } from '@/Adapter/config';

const TYPES = {
    SET_ADAPTER_BY_ECOSYSTEM: 'SET_ADAPTER_BY_ECOSYSTEM',

    SET_WALLET: 'SET_WALLET',
    SET_WALLETS_MODULE: 'SET_WALLETS_MODULE',
    DISCONNECT_ALL_WALLETS: 'DISCONNECT_ALL_WALLETS',

    SET_ECOSYSTEM: 'SET_ECOSYSTEM',

    SET_MODAL_STATE: 'SET_MODAL_STATE',
    SET_IS_CONNECTING: 'SET_IS_CONNECTING',
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
        isConnecting: false,
        ecosystem: null,
        adapters: {
            [ECOSYSTEMS.EVM]: null,
            [ECOSYSTEMS.COSMOS]: null,
        },
        wallets: connectedWallets,
        walletsModule: [],
    }),

    getters: {
        isOpen: (state) => state.isOpen,
        isConnecting: (state) => state.isConnecting,
        getEcosystem: (state) => state.ecosystem,
        getAdapterByEcosystem: (state) => (ecosystem) => state.adapters[ecosystem] || null,
        getWalletsModule: (state) => state.walletsModule,
        getWallets: (state) => state.wallets,
    },

    mutations: {
        [TYPES.SET_MODAL_STATE](state, value) {
            state.isOpen = value;
        },
        [TYPES.SET_IS_CONNECTING](state, value) {
            state.isConnecting = value;
        },
        [TYPES.SET_ECOSYSTEM](state, value) {
            state.ecosystem = value;
        },
        [TYPES.SET_ADAPTER_BY_ECOSYSTEM](state, { ecosystem, adapter }) {
            state.adapters[ecosystem] = adapter;
        },
        [TYPES.SET_WALLETS_MODULE](state, value) {
            state.walletsModule = value;
        },
        [TYPES.SET_WALLET](state, value) {
            window.localStorage.setItem('adapter:lastConnectedWallet', JSON.stringify(value));

            const found = state.wallets.filter((wallet) => wallet.account === value.account || wallet.ecosystem === value.ecosystem);

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
            state.ecosystem = null;
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
        setIsConnecting({ commit }, value) {
            commit(TYPES.SET_IS_CONNECTING, value);
        },
        initializeAdapter({ commit }, ecosystem) {
            const adapter = Adapters(ecosystem);
            commit(TYPES.SET_ADAPTER_BY_ECOSYSTEM, { ecosystem, adapter });
        },
    },
};
