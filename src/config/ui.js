/* eslint-disable no-unused-vars */
import { ECOSYSTEMS } from '@/Adapter/config';

const MAIN_DASHBOARD = {
    icon: 'overviewIcon',
    title: 'Overview',
    key: 'main',
    to: '/main',
    disabled: false,
    type: 'layout',
};

const SEND = {
    icon: 'sendIcon',
    title: 'Send',
    key: 'send',
    to: '/send',
    disabled: true,
    type: 'layout',
};

const BRIDGE = {
    icon: 'bridgeIcon',
    title: 'Bridge',
    key: 'bridge',
    to: '/bridge',
    disabled: true,
    type: 'layout',
};

const SWAP = {
    icon: 'swapIcon',
    title: 'Swap',
    key: 'swap',
    to: '/swap',
    disabled: true,
    type: 'layout',
};

const SUPER_SWAP = {
    icon: 'superSwapIcon',
    title: 'Super Swap',
    key: 'superSwap',
    to: '/super-swap',
    status: 'BETA',
    disabled: true,
    type: 'layout',
};

const SHORTCUTS = {
    icon: 'superSwapIcon',
    title: 'Shortcuts',
    key: 'shortcuts',
    to: '/shortcuts',
    status: '',
    disabled: false,
    type: 'layout',
};

const SIDEBAR_MODULES = [MAIN_DASHBOARD, SEND, SWAP, BRIDGE, SUPER_SWAP, SHORTCUTS];

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
    if (!ecosystem) {
        return {
            sidebar: [],
        };
    }

    // Copy without reference, to avoid changing the default config

    const config = JSON.parse(JSON.stringify(defaultConfig[ecosystem]));
    const defaultSidebar = JSON.parse(JSON.stringify(SIDEBAR_MODULES));

    let { sidebar = [] } = config || {};

    if (!network) {
        return { ...config, sidebar };
    }

    sidebar = checkIsDisabled(defaultSidebar, sidebar);

    return { ...config, sidebar };
};

export default getUIConfig;
