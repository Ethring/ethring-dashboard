export const services = [
    {
        name: '1inchSwap',
        type: 'swap',
        icon: 'https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=025',
        url: process.env.VUE_APP_1INCH_SWAP_API,
        estimatedTime: {
            1: 50,
            56: 30,
            137: 30,
            42161: 30,
            43114: 30,
        },
    },
    {
        name: 'ParaSwap',
        type: 'swap',
        icon: 'https://stakingcrypto.info/static/assets/coins/paraswap-logo.png',
        url: process.env.VUE_APP_PARASWAP_API,
        estimatedTime: {
            1: 60,
            56: 30,
            137: 30,
            42161: 30,
            43114: 30,
        },
    },
    // {
    //     name: 'SynapseSwap',
    //     type: 'swap',
    //     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/12147.png',
    //     url: process.env.VUE_APP_SYNAPSE_SWAP_API,
    //     estimatedTime: {
    //         1: 60,
    //         56: 30,
    //         137: 30,
    //         42161: 30,
    //         43114: 30,
    //     },
    // },
];
