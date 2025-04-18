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
import txManager from '@/core/transaction-manager/store';

// Adapters for different networks
import adapters from '@/core/wallet-adapter/store';

// Bridge-dex
import bridgeDexAPI from '@/modules/bridge-dex/store';

// Portal-fi
import portalFi from '@/modules/portal-fi/store';

// Update balance for account
import updateBalance from '@/store/update-balance';
import moduleStates from '@/store/moduleStates';
import shortcuts from '@/core/shortcuts/store';

import operationBag from '@/core/operations/store';

import stakeAssets from '@/store/stake-assets';

// Shortcuts
import shortcutsList from '@/store/shortcut-list';

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
        bridgeDexAPI,
        updateBalance,
        moduleStates,
        shortcuts,
        shortcutsList,
        portalFi,
        operationBag,

        stakeAssets,
    },
});
