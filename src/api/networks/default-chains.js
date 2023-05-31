export default [
    {
        id: '0x1',
        token: 'ETH',
        label: 'Ethereum Mainnet',
        rpcUrl: 'https://eth.llamarpc.com',
        secondaryTokens: [
            {
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/usdt.svg`,
            },
            {
                address: '0x111111111117dc0aa78b770fa6a738034120c302',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/1inch.svg`,
            },
            {
                address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/bnb.svg`,
            },
            {
                address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/uni.svg`,
            },
        ],
    },
    {
        id: '0x38',
        token: 'BNB',
        label: 'Binance Smart Chain',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        secondaryTokens: [
            {
                address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/usdc.svg`,
            },
            {
                address: '0x85eac5ac2f758618dfa09bdbe0cf174e7d574d5b',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/trx.svg`,
            },
            {
                address: '0x0Eb3a705fc54725037CC9e008bDede697f62F335',
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/icon/atom.svg`,
            },
        ],
    },
    {
        id: '0xa4b1',
        token: 'ETH',
        label: 'Arbitrum',
        rpcUrl: 'https://arbitrum.blockpi.network/v1/rpc/public	',
    },
    {
        id: '0xa',
        token: 'ETH',
        label: 'Optimism',
        rpcUrl: 'https://mainnet.optimism.io',
    },
];
