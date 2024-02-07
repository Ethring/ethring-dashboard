import { createStore } from 'vuex';

// Main Modules
import app from '@/store/app';

// Balances
import tokens from '@/store/tokens';

// Chain-registry and tokens
import configs from '@/store/configs';

// Operations
import operations from '@/store/operations';

// Transaction manager
import txManager from '@/Transactions/store';

// Adapters for different networks
import adapters from '@/Adapter/store';

// Bridge-dex
import bridgeDex from '@/store/bridge-dex';

export default createStore({
    state: {},
    mutations: {},
    actions: {},
    modules: {
        app,
        configs,
        adapters,
        tokens,
        tokenOps: operations,
        txManager,
        bridgeDex,
    },
});
