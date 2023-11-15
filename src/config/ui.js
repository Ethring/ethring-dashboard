/* eslint-disable no-unused-vars */
import { ECOSYSTEMS } from '@/Adapter/config';

const MAIN_DASHBOARD = {
    component: 'overviewIcon',
    title: 'Main',
    key: 'main',
    to: '/main',
    disabled: false,
    type: 'layout',
};

const SEND = {
    component: 'sendIcon',
    title: 'Send',
    key: 'send',
    to: '/send',
    disabled: false,
    type: 'layout',
};

const BRIDGE = {
    component: 'bridgeIcon',
    title: 'Bridge',
    key: 'bridge',
    to: '/bridge',
    disabled: false,
    type: 'layout',
};

const SWAP = {
    component: 'swapIcon',
    title: 'Swap',
    key: 'swap',
    to: '/swap',
    disabled: false,
    type: 'layout',
};

const SUPER_SWAP = {
    component: 'superSwapIcon',
    title: 'SuperSwap',
    key: 'superSwap',
    to: '/super-swap',
    status: 'BETA',
    disabled: false,
    type: 'layout',
};

const BUY_CRYPTO = {
    component: 'buyCryptoIcon',
    title: 'Buy Crypto',
    key: 'buyCrypto',
    to: '/buy-crypto',
    status: 'BETA',
    disabled: false,
    type: 'modal',
};

const SIDEBAR_MODULES = [MAIN_DASHBOARD, SEND, SWAP, BRIDGE, SUPER_SWAP, BUY_CRYPTO];

const defaultConfig = {
    [ECOSYSTEMS.EVM]: {
        sidebar: SIDEBAR_MODULES,
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
        superSwap: {
            component: 'SuperSwap',
        },
        buyCrypto: {
            component: 'BuyCrypto',
        },
    },
    [ECOSYSTEMS.COSMOS]: {
        sidebar: [MAIN_DASHBOARD, SEND],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
        superSwap: {
            component: 'SuperSwap',
        },
        buyCrypto: {
            component: 'BuyCrypto',
        },
    },
};

const CUSTOM_UI_BY_CHAIN = {
    optimism: {
        sidebar: [MAIN_DASHBOARD, SEND, SWAP],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
        superSwap: {
            component: 'SuperSwap',
        },
        buyCrypto: {
            component: 'BuyCrypto',
        },
    },
    fantom: {
        sidebar: [MAIN_DASHBOARD, SEND],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
        superSwap: {
            component: 'SuperSwap',
        },
        buyCrypto: {
            component: 'BuyCrypto',
        },
    },
};

const checkIsDisabled = (config, sidebar) => {
    for (const module of config) {
        if (module.disabled) {
            continue;
        }

        if (sidebar.some((item) => item.key === module.key)) {
            module.disabled = false;
            continue;
        }

        module.disabled = true;
    }

    return config;
};

const getUIConfig = (network, ecosystem) => {
    if (!network || !ecosystem) {
        return {
            sidebar: [],
        };
    }

    // Copy without reference, to avoid changing the default config

    if (!network || !ecosystem) {
        return {
            sidebar: [],
        };
    }

    const config = JSON.parse(JSON.stringify(defaultConfig[ecosystem]));
    const defaultSidebar = JSON.parse(JSON.stringify(SIDEBAR_MODULES));

    let { sidebar = [] } = config || {};

    if (CUSTOM_UI_BY_CHAIN[network] && CUSTOM_UI_BY_CHAIN[network].sidebar) {
        const networkConfig = CUSTOM_UI_BY_CHAIN[network].sidebar;
        sidebar = checkIsDisabled(sidebar, networkConfig);

        return { ...config, sidebar };
    }

    sidebar = checkIsDisabled(defaultSidebar, sidebar);

    return { ...config, sidebar };
};

export default getUIConfig;
