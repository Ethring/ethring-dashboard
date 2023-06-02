const defaultSidebarItems = [
    { component: 'mainSvg', title: 'Main', key: 'main', to: '/main' },
    { component: 'stakeSvg', title: 'Send', key: 'send', to: '/send' },
    { component: 'swapSvg', title: 'Swap', key: 'swap', to: '/swap' },
    { component: 'bridgeSvg', title: 'Bridge', key: 'bridge', to: '/bridge' },
];

export const UIConfig = {
    bsc: {
        sidebar: [
            ...defaultSidebarItems,
            // { component: "stakeSvg", title: "Stake", key: "stake", to: "/stake" },
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
    },
};
