export const services = [
    {
        name: 'deBridge',
        type: 'bridge',
        icon: 'https://app.debridge.finance/assets/images/bridge.svg',
        url: process.env.VUE_APP_DEBRIDGE_API,
        recipientAddress: true,
        estimatedTime: {
            1: 150,
            56: 60,
            137: 60,
            42161: 60,
            43114: 60,
        },
        protocolFee: {
            1: '0.001',
            56: '0.005',
            137: '0.5',
            42161: '0.001',
            43114: '0.01',
        },
    },
    {
        name: 'Squid Router',
        type: 'bridge',
        icon: 'https://app.squidrouter.com/images/icons/squid_logo.svg',
        url: process.env.VUE_APP_SQUID_ROUTER_API,
        estimatedTime: {
            1: 60,
            56: 60,
            137: 60,
            42161: 60,
            43114: 60,
        },
    },
];
