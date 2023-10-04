/* eslint-disable no-unused-vars */
import { ECOSYSTEMS } from '@/Adapter/config';

const MAIN_DASHBOARD = {
    component: 'overviewIcon',
    title: 'Main',
    key: 'main',
    to: '/main',
};

const SEND = {
    component: 'sendIcon',
    title: 'Send',
    key: 'send',
    to: '/send',
};

const BRIDGE = {
    component: 'bridgeIcon',
    title: 'Bridge',
    key: 'bridge',
    to: '/bridge',
};

const SWAP = {
    component: 'swapIcon',
    title: 'Swap',
    key: 'swap',
    to: '/swap',
};

const SUPER_SWAP = {
    component: 'superSwapIcon',
    title: 'SuperSwap',
    key: 'superSwap',
    to: '/superSwap',
    status: 'BETA',
};

const BUY_CRYPTO = {
    component: 'buyCryptoIcon',
    title: 'Buy Crypto',
    key: 'buyCrypto',
    to: '/buy',
    status: 'SOON',
    disabled: true,
};

const defaultConfig = {
    [ECOSYSTEMS.EVM]: {
        sidebar: [MAIN_DASHBOARD, SEND, SWAP, BRIDGE, SUPER_SWAP, BUY_CRYPTO],
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
    },
    [ECOSYSTEMS.COSMOS]: {
        sidebar: [
            MAIN_DASHBOARD,
            SEND,
            // SWAP,
            // BRIDGE,
            // SUPER_SWAP,
        ],
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
    },
};

const UIConfig = {
    optimism: {
        sidebar: [
            MAIN_DASHBOARD,
            SEND,
            // SWAP,
            // BRIDGE,
            // SUPER_SWAP,
        ],
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
    },
};

const getUIConfig = (network, ecosystem) => {
    const config = { ...defaultConfig[ecosystem] };

    const isDisableModule = (item) => item.key !== 'buyCrypto';

    config.sidebar = config.sidebar?.map((item) => ({
        ...item,
        disabled: !isDisableModule(item)
    }));

    if (UIConfig[network]) {
        const networkConfig = UIConfig[network];

        config.sidebar.forEach((item) => {
            if (!networkConfig.sidebar.some((networkItem) => networkItem.key === item.key)) {
                item.disabled = true;
            } 
        });
    }

    return config;
};

export default getUIConfig;
