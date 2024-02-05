import { createStore } from 'vuex';

// Main Modules
import app from './app';
import tokens from './tokens';

import configs from './configs';

// Services
import bridge from './services/bridge';
import swap from './services/swap';

// Operations
import operations from './operations';

// Transaction manager
import txManager from '../Transactions/store';

// Adapters for different networks
import adapters from '../Adapter/store';

// Bridge-dex
import bridgeDex from './bridge-dex';

// const dataState = createPersistedState({
//     key: 'zomet-app',
//     storage: {
//         getItem: (key) => localStorage.getItem(key),
//         setItem: (key, value) => localStorage.setItem(key, value),
//         removeItem: (key) => localStorage.removeItem(key),
//     },
//     paths: ['app.showBalance', 'tokens.favorites'],
// });

export default createStore({
    state: {},
    mutations: {},
    actions: {},
    modules: {
        app,
        configs,
        adapters,
        tokens,
        bridge,
        swap,
        tokenOps: operations,
        txManager,
        bridgeDex,
    },
    // plugins: [dataState],
});
