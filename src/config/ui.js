/* eslint-disable no-unused-vars */
import { ECOSYSTEMS } from '@/Adapter/config';

const MAIN_DASHBOARD = {
    component: 'overviewSvg',
    title: 'Main',
    key: 'main',
    to: '/main',
};

const SEND = {
    component: 'sendSvg',
    title: 'Send',
    key: 'send',
    to: '/send',
};

const BRIDGE = {
    component: 'bridgeSvg',
    title: 'Bridge',
    key: 'bridge',
    to: '/bridge',
};

const SWAP = {
    component: 'swapSvg',
    title: 'Swap',
    key: 'swap',
    to: '/swap',
};

const SUPER_SWAP = {
    component: 'superSwapSvg',
    title: 'SuperSwap',
    key: 'superSwap',
    to: '/superSwap',
};

const BUY_CRYPTO = {
    component: 'buyCryptoSvg',
    title: 'Buy Crypto',
    key: 'buyCrypto',
    to: '/buy',
};

const defaultConfig = {
    [ECOSYSTEMS.EVM]: {
        sidebar: [
            MAIN_DASHBOARD,
            SEND,
            SWAP,
            BRIDGE,
            // SUPER_SWAP,
            // BUY_CRYPTO,
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
    return UIConfig[network] || defaultConfig[ecosystem];
};

export default getUIConfig;
