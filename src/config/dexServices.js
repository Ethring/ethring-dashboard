export const services = [
    {
        name: '1inchSwap',
        type: 'swap',
        icon: 'https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=025',
        url: process.env.VUE_APP_1INCH_SWAP_API,
        estimatedTime: {
            1: 60,
            56: 60,
            137: 60,
            42161: 60,
            43114: 60,
        },
    },
    {
        name: 'ParaSwap',
        type: 'swap',
        icon: 'https://stakingcrypto.info/static/assets/coins/paraswap-logo.png',
        url: process.env.VUE_APP_PARASWAP_API,
        estimatedTime: {
            1: 60,
            56: 60,
            137: 60,
            42161: 60,
            43114: 60,
        },
    },
];
