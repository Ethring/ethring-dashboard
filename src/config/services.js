import { ECOSYSTEMS } from '@/Adapter/config';

export const SERVICE_TYPE = {
    BRIDGE: 'bridge',
    SWAP: 'swap',
};

const ALL_SERVICES = [
    {
        id: 'bridge-debridge',
        name: 'deBridge',
        type: SERVICE_TYPE.BRIDGE,
        icon: 'https://app.debridge.finance/assets/images/bridge.svg',
        url: process.env.VUE_APP_DEBRIDGE_API,
        recipientAddress: true,
        tokensByChain: true,
        namespace: ECOSYSTEMS.EVM,
        estimatedTime: {
            1: 150,
            56: 60,
            137: 60,
            42161: 60,
            43114: 60,
            10: 60,
        },
        protocolFee: {
            1: '0.001',
            56: '0.005',
            137: '0.5',
            42161: '0.001',
            43114: '0.01',
            10: '0.001',
        },
    },
    {
        id: 'bridge-squid',
        name: 'Squid Router',
        type: SERVICE_TYPE.BRIDGE,
        icon: 'https://app.squidrouter.com/images/icons/squid_logo.svg',
        url: process.env.VUE_APP_SQUID_ROUTER_API,
        tokensByChain: true,
        namespace: ECOSYSTEMS.EVM,
        estimatedTime: {
            1: 60,
            56: 60,
            137: 60,
            42161: 60,
            43114: 60,
            10: 60,
        },
    },
    {
        id: 'bridge-skip',
        name: 'Skip service',
        type: SERVICE_TYPE.BRIDGE,
        icon: 'https://skip.money/_next/static/media/skip-logo.1bdb8b7b.svg',
        url: process.env.VUE_APP_SKIP_API,
        tokensByChain: true,
        namespace: ECOSYSTEMS.COSMOS,
    },
    {
        id: 'swap-skip',
        name: 'Skip service',
        type: SERVICE_TYPE.SWAP,
        icon: 'https://skip.money/_next/static/media/skip-logo.1bdb8b7b.svg',
        url: process.env.VUE_APP_SKIP_API,
        tokensByChain: true,
        namespace: ECOSYSTEMS.COSMOS,
    },
    {
        id: 'swap-1inch',
        name: '1inchSwap',
        type: SERVICE_TYPE.SWAP,
        icon: 'https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=025',
        url: process.env.VUE_APP_1INCH_SWAP_API,
        tokensByChain: false,
        namespace: ECOSYSTEMS.EVM,
        estimatedTime: {
            1: 50,
            56: 30,
            137: 30,
            42161: 30,
            43114: 30,
            10: 30,
        },
    },
    {
        id: 'swap-paraswap',
        name: 'ParaSwap',
        type: SERVICE_TYPE.SWAP,
        icon: 'https://stakingcrypto.info/static/assets/coins/paraswap-logo.png',
        url: process.env.VUE_APP_PARASWAP_API,
        tokensByChain: false,
        namespace: ECOSYSTEMS.EVM,
        estimatedTime: {
            1: 60,
            56: 30,
            137: 30,
            42161: 30,
            43114: 30,
            10: 30,
        },
    },
    {
        id: 'swap-synapse',
        name: 'SynapseSwap',
        type: SERVICE_TYPE.SWAP,
        icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/12147.png',
        url: process.env.VUE_APP_SYNAPSE_SWAP_API,
        tokensByChain: true,
        isStableSwap: true,
        namespace: ECOSYSTEMS.EVM,
        estimatedTime: {
            1: 60,
            56: 30,
            137: 30,
            42161: 30,
            43114: 30,
            10: 30,
        },
    },
];

export const getServices = (type, namespace = ECOSYSTEMS.EVM) => {
    if (type) {
        return ALL_SERVICES.filter((service) => service.type === type && service.namespace === namespace);
    }

    return ALL_SERVICES;
};
