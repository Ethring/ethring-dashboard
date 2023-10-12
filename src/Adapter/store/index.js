import * as TYPES from './types';
import * as GETTERS from './getters';

import { useLocalStorage } from '@vueuse/core';

import { ECOSYSTEMS } from '@/Adapter/config';
import EcosystemAdapter from '@/Adapter/ecosystems';

const LAST_CONNECTED_WALLET_KEY = 'adapter:lastConnectedWallet';
const CONNECTED_WALLETS_KEY = 'adapter:connectedWallets';
const IS_CONNECTED_KEY = 'adapter:isConnected';

const connectedWalletsStorage = useLocalStorage(CONNECTED_WALLETS_KEY, [], { mergeDefaults: true });
const lastConnectedWalletStorage = useLocalStorage(LAST_CONNECTED_WALLET_KEY, {}, { mergeDefaults: true });
const isConnectedStorage = useLocalStorage(IS_CONNECTED_KEY, false, { mergeDefaults: true });

function findKeyDifferences(oldRecord, newRecord) {
    return Object.keys(oldRecord)
        .concat(Object.keys(newRecord))
        .filter((key) => oldRecord[key] !== newRecord[key]);
}

const MODALS = {
    WALLETS: 'wallets',
    ADDRESSES: 'addresses',
};

export default {
    namespaced: true,
    state: {
        adapters: {
            [ECOSYSTEMS.EVM]: EcosystemAdapter(ECOSYSTEMS.EVM),
            [ECOSYSTEMS.COSMOS]: EcosystemAdapter(ECOSYSTEMS.COSMOS),
        },

        modals: {
            [MODALS.WALLETS]: false,
            [MODALS.ADDRESSES]: false,
        },

        modalEcosystem: null,

        isConnecting: false,

        ecosystem: null,

        wallets: connectedWalletsStorage.value,
        lastConnectedWallet: lastConnectedWalletStorage.value,
        isConnected: isConnectedStorage.value,
    },
    getters: {
        [GETTERS.IS_OPEN]:
            (state) =>
            (name = MODALS.WALLETS) =>
                state.modals[name],

        [GETTERS.IS_CONNECTING]: (state) => state.isConnecting,

        [GETTERS.MODAL_ECOSYSTEM]: (state) => state.modalEcosystem || state.ecosystem,

        [GETTERS.CURRENT_ECOSYSTEM]: (state) => state.ecosystem,

        [GETTERS.CURRENT_ADAPTER]: (state) => state.adapters[state.ecosystem] || null,

        [GETTERS.ADAPTER_BY_ECOSYSTEM]: (state) => (ecosystem) => state.adapters[ecosystem] || null,

        [GETTERS.CONNECTED_WALLETS]: (state) => state.wallets,
        [GETTERS.LAST_CONNECTED_WALLET]: (state) => state.lastConnectedWallet,

        [GETTERS.IS_CONNECTED]: (state) => state.isConnected,
    },
    actions: {
        // * Actions for Modals
        [TYPES.SET_MODAL_STATE]({ commit }, { name, isOpen }) {
            commit(TYPES.SET_MODAL_STATE, { name, isOpen });
        },
        [TYPES.SET_MODAL_ECOSYSTEM]({ commit }, ecosystem) {
            commit(TYPES.SET_MODAL_ECOSYSTEM, ecosystem);
        },

        // * Actions for Adapters
        [TYPES.SWITCH_ECOSYSTEM]({ commit }, ecosystem) {
            commit(TYPES.SWITCH_ECOSYSTEM, ecosystem);
        },
        [TYPES.SET_WALLETS_MODULE]({ commit }, walletsModule) {
            commit(TYPES.SET_WALLETS_MODULE, walletsModule);
        },
        [TYPES.SET_IS_CONNECTING]({ commit }, isConnecting) {
            commit(TYPES.SET_IS_CONNECTING, isConnecting);
        },
        [TYPES.SET_WALLET]({ commit }, { ecosystem, wallet }) {
            commit(TYPES.SET_WALLET, { ecosystem, wallet });
        },
        [TYPES.DISCONNECT_WALLET]({ commit }, wallet) {
            commit(TYPES.DISCONNECT_WALLET, wallet);
        },
        [TYPES.DISCONNECT_ALL_WALLETS]({ commit }) {
            commit(TYPES.DISCONNECT_ALL_WALLETS);
        },
        [TYPES.SET_IS_CONNECTED]({ commit }, isConnected) {
            commit(TYPES.SET_IS_CONNECTED, isConnected);
        },
    },
    mutations: {
        [TYPES.SET_WALLET](state, { ecosystem, wallet }) {
            lastConnectedWalletStorage.value = wallet;

            const found = state.wallets.filter((w) => w.id === wallet.id || w.ecosystem === ecosystem);
            const [exist] = found;

            if (!exist) {
                state.wallets.push(wallet);
                return (connectedWalletsStorage.value = state.wallets);
            }

            findKeyDifferences(exist, wallet).forEach((key) => {
                exist[key] = wallet[key];
            });

            return (connectedWalletsStorage.value = state.wallets);
        },
        [TYPES.SET_MODAL_STATE](state, { name, isOpen }) {
            state.modals[name] = isOpen;
        },
        [TYPES.SET_MODAL_ECOSYSTEM](state, value) {
            state.modalEcosystem = value;
        },
        [TYPES.SET_IS_CONNECTING](state, value) {
            state.isConnecting = value;
        },
        [TYPES.SWITCH_ECOSYSTEM](state, value) {
            state.ecosystem = value;
        },
        [TYPES.SET_ADAPTER_BY_ECOSYSTEM](state, { ecosystem, adapter }) {
            state.adapters[ecosystem] = adapter;
        },
        [TYPES.SET_WALLETS_MODULE](state, value) {
            state.walletsModule = value;
        },
        [TYPES.DISCONNECT_WALLET](state, wallet) {
            state.wallets = state.wallets.filter((w) => w.id !== wallet.id);

            if (state.lastConnectedWallet.id === wallet.id) {
                state.lastConnectedWallet = {};
                lastConnectedWalletStorage.value = {};
            }

            if (!state.wallets.length) {
                state.ecosystem = null;
            }

            isConnectedStorage.value = false;

            return (connectedWalletsStorage.value = state.wallets);
        },
        [TYPES.DISCONNECT_ALL_WALLETS](state) {
            state.wallets = [];
            state.ecosystem = null;

            connectedWalletsStorage.value = [];
            lastConnectedWalletStorage.value = {};
            isConnectedStorage.value = false;
        },
        [TYPES.SET_IS_CONNECTED](state, value) {
            state.isConnected = value;
        },
    },
};
