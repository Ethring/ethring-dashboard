/* eslint-disable no-unused-vars */
import { ECOSYSTEMS } from '@/Adapter/config';

const MAIN_DASHBOARD = {
    component: 'mainSvg',
    title: 'Main',
    key: 'main',
    to: '/main',
};

const SEND = {
    component: 'stakeSvg',
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
    component: 'swapSvg',
    title: 'SuperSwap',
    key: 'superSwap',
    to: '/superSwap',
};

const defaultConfig = {
    [ECOSYSTEMS.EVM]: {
        sidebar: [
            MAIN_DASHBOARD,
            SEND,
            SWAP,
            BRIDGE,
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
