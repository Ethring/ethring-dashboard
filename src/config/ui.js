const defaultSidebarItems = [
    { component: 'mainSvg', title: 'Main', key: 'main', to: '/main' },
    { component: 'stakeSvg', title: 'Send', key: 'send', to: '/send' },
    { component: 'swapSvg', title: 'Swap', key: 'swap', to: '/swap' },
    { component: 'swapSvg', title: 'SuperSwap', key: 'superSwap', to: '/superSwap' },
    { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' },
];

export const UIConfig = {
    bsc: {
        sidebar: [...defaultSidebarItems],
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
    eth: {
        sidebar: [...defaultSidebarItems],
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
    polygon: {
        sidebar: [...defaultSidebarItems],
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
    optimism: {
        sidebar: [...defaultSidebarItems],
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
    avalanche: {
        sidebar: [...defaultSidebarItems],
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
    arbitrum: {
        sidebar: [...defaultSidebarItems],
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
