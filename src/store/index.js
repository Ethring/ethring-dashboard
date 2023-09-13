import createPersistedState from 'vuex-persistedstate';
import { createStore } from 'vuex';

import networks from './networks';
import tokens from './tokens';
import app from './app';
import bridge from './bridge/bridge';
import swap from './swap/swap';
// import adapter from './adapter';
import adapters from '../Adapter/store';

const dataState = createPersistedState({
    key: 'zomet-app',
    storage: {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
    },
    paths: ['app.showBalance', 'tokens.favorites'],
});

export default createStore({
    state: {},
    mutations: {},
    actions: {},
    modules: {
        app,
        // adapter,
        adapters,
        networks,
        tokens,
        bridge,
        swap,
    },
    plugins: [dataState],
});
