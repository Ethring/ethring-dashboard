const defaultSidebarItems = [
    { component: 'mainSvg', title: 'Main', key: 'main', to: '/main' },
    // { component: 'stakeSvg', title: 'Send', key: 'send', to: '/send' },
    { component: 'swapSvg', title: 'Swap', key: 'swap', to: '/swap' },
    { component: 'swapSvg', title: 'SuperSwap', key: 'superSwap', to: '/superSwap' },
];

export const UIConfig = {
    bsc: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        // send: {
        //     component: 'SimpleSend',
        // },
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
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        // send: {
        //     component: 'SimpleSend',
        // },
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
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        // send: {
        //     component: 'SimpleSend',
        // },
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
        // send: {
        //     component: 'SimpleSend',
        // },
        swap: {
            component: 'SimpleSwap',
        },
        superSwap: {
            component: 'SuperSwap',
        },
    },
    avalanche: {
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        // send: {
        //     component: 'SimpleSend',
        // },
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
        sidebar: [...defaultSidebarItems, { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' }],
        // send: {
        //     component: 'SimpleSend',
        // },
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
