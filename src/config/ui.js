const defaultSidebarItems = [
    { component: 'mainSvg', title: 'Main', key: 'main', to: '/main' },
    { component: 'stakeSvg', title: 'Send', key: 'send', to: '/send' },
    { component: 'swapSvg', title: 'Swap', key: 'swap', to: '/swap' },
];

export const UIConfig = {
    bsc: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
    },
    eth: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
    },
    polygon: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
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
    },
    avalanche: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
    },
    arbitrum: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        send: {
            component: 'SimpleSend',
        },
        swap: {
            component: 'SimpleSwap',
        },
        bridge: {
            component: 'SimpleBridge',
        },
    },
};
