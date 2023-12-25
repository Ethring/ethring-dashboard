const EVM_NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];

const emptyBalanceMockData = { ok: true, data: { tokens: [], nfts: [], integrations: [] }, error: '' };

const errorGetBalanceMockData = {
    ok: false,
    data: null,
    error: 'Data updates with a delay.',
};

const errorEstimateSwap = {
    ok: false,
    data: null,
    error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Estimate route is not found for chosen pair',
    },
};

const mockBalanceData = {
    eth: emptyBalanceMockData,
    optimism: emptyBalanceMockData,
    arbitrum: {
        ok: true,
        data: {
            tokens: [
                {
                    name: '',
                    symbol: 'ARB',
                    address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
                    decimals: 18,
                    logo: '',
                    price: '1.138002719441929',
                    priceChange: '0.0755044396144533',
                    balanceUsd: '0.20888396147676655',
                    balance: '0.18355313032925108',
                },
                {
                    name: 'GMX',
                    symbol: 'GMX',
                    address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png?1631532468',
                    price: '52.65793842662526',
                    priceChange: '3.1988223178087765',
                    balanceUsd: '0.4343404827274045',
                    balance: '0.008248338155748809',
                },
                {
                    name: 'USD Coin',
                    symbol: 'USDC',
                    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                    decimals: 6,
                    logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
                    price: '0.9914991608771323',
                    priceChange: '-0.008022752663145782',
                    balanceUsd: '2.0574638747327807',
                    balance: '2.075104',
                },
                {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
                    price: '2037.0195409074433',
                    priceChange: '151.1016153396531',
                    balanceUsd: '47.9149436132852',
                    balance: '0.023522083441546292',
                },
                {
                    name: 'IBC - stCMDX',
                    symbol: 'IBC.STCMDX',
                    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5832',
                    decimals: 6,
                    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/stride/images/stcmdx.png',
                    price: null,
                    priceChange: null,
                    balanceUsd: null,
                    balance: '20.0',
                },
            ],
            nfts: [],
            integrations: [
                {
                    integrationId: 'ARBITRUM_CURVE_LPOOL__0x7f90122bf0700f9e7e1f688fe926940e8839f353',
                    chain: 'ARBITRUM',
                    name: 'Arbitrum Curve Pools',
                    platform: 'CURVE',
                    type: 'LIQUIDITY_POOL',
                    logo: 'https://dao.curve.fi/logo.png',
                    url: 'https://curve.fi/',
                    balances: [
                        {
                            name: 'USD Coin (Arb1)',
                            symbol: 'USDC',
                            address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
                            decimals: 6,
                            logo: null,
                            price: '0.9825563272890866',
                            priceChange: null,
                            balanceUsd: '11.766128750772483',
                            balance: '11.9750170285257',
                            balanceType: 'DEPOSIT',
                            unlockTimestamp: null,
                        },
                        {
                            name: 'Tether',
                            symbol: 'USDT',
                            address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
                            decimals: 6,
                            logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663',
                            price: '0.9928727969031991',
                            priceChange: '-0.005918202796184824',
                            balanceUsd: '5.817020495260484',
                            balance: '5.8587771901939005',
                            balanceType: 'DEPOSIT',
                            unlockTimestamp: null,
                        },
                    ],
                    address: '0x7f90122bf0700f9e7e1f688fe926940e8839f353',
                },
                {
                    integrationId: 'ARB_RADIANT_V2_BORROW__0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1',
                    chain: 'ARBITRUM',
                    name: 'Borrow and Lending v2',
                    platform: 'RADIANT',
                    type: 'BORROW_AND_LENDING',
                    logo: 'https://assets.coingecko.com/coins/images/26536/small/Radiant-Logo-200x200.png?1658715865',
                    url: 'https://app.radiant.capital/#/markets',
                    balances: [
                        {
                            name: 'USD Coin (Arb1)',
                            symbol: 'USDC',
                            address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
                            decimals: 6,
                            logo: null,
                            price: '0.9825563272890866',
                            priceChange: null,
                            balanceUsd: '0.9868432205450488',
                            balance: '1.004363',
                            balanceType: 'BORROW',
                            unlockTimestamp: null,
                        },
                        {
                            name: 'WETH',
                            symbol: 'WETH',
                            address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/2518/large/weth.png?1628852295',
                            price: '2037.0195409074433',
                            priceChange: '157.30828114983342',
                            balanceUsd: '4.076097310745412',
                            balance: '0.002001010411971605',
                            balanceType: 'DEPOSIT_COLLATERAL',
                            unlockTimestamp: null,
                        },
                    ],
                    apr: -1.965587752234046,
                    debtType: 'LOAN',
                    apy: '1.3556046317430464',
                    healthRate: 69.73688477874622,
                },
                {
                    integrationId: 'GMX_STAKE_ARBITRUM__0xa906f338cb21815cbc4bc87ace9e68c87ef8d8f1',
                    chain: 'ARBITRUM',
                    name: 'GMX Earn',
                    platform: 'GMX',
                    type: 'STAKING',
                    logo: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png?1631532468',
                    url: 'https://gmx.io/',
                    balances: [
                        {
                            name: 'GMX',
                            symbol: 'GMX',
                            address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png?1631532468',
                            price: '52.65793842662526',
                            priceChange: '3.1988223178087765',
                            balanceUsd: '15.797381527987577',
                            balance: '0.3',
                            balanceType: 'DEPOSIT',
                            unlockTimestamp: null,
                        },
                        {
                            name: 'WETH',
                            symbol: 'WETH',
                            address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/2518/large/weth.png?1628852295',
                            price: '2037.0195409074433',
                            priceChange: '157.30828114983342',
                            balanceUsd: '0.006382617386734572',
                            balance: '3.133311810986e-06',
                            balanceType: 'PENDING_REWARD',
                            unlockTimestamp: null,
                        },
                    ],
                    stakingType: 'DEPOSIT',
                    validator: {
                        name: null,
                        status: null,
                        address: null,
                        commission_percentage: null,
                    },
                },
                {
                    integrationId: 'ARBITRUM_PERPETUALS_GMX__0x70d95587d40a2caf56bd97485ab3eec10bee6336',
                    chain: 'ARBITRUM',
                    name: 'Futures Market V2',
                    platform: 'GMX',
                    type: 'FUTURES',
                    logo: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png?1631532468',
                    url: 'https://gmx.io/',
                    balances: [
                        {
                            name: 'USD Coin',
                            symbol: 'USDC',
                            address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                            decimals: 6,
                            logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
                            price: '0.9914991608771323',
                            priceChange: '-0.008022752663145782',
                            balanceUsd: '4.482317500251731',
                            balance: '4.520747648728656',
                            balanceType: 'LEVERAGE_POSITION',
                            unlockTimestamp: null,
                        },
                        {
                            name: 'USD Coin',
                            symbol: 'USDC',
                            address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
                            decimals: 6,
                            logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
                            price: '0.9914991608771323',
                            priceChange: '-0.008022752663145782',
                            balanceUsd: '2.347820089713762',
                            balance: '2.3679496487286555',
                            balanceType: 'BORROW',
                            unlockTimestamp: null,
                        },
                    ],
                    healthRate: null,
                    leverageRate: '2.099940472226681',
                    debtType: 'LEVERAGE_POSITION',
                    address: null,
                },
            ],
        },
        error: '',
    },
    bsc: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'BNB',
                    symbol: 'BNB',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1644979850',
                    price: '231.7273533061002',
                    priceChange: '7.328542197451725',
                    balanceUsd: '34.60984852062547',
                    balance: '0.14935590480295002',
                },
                {
                    name: 'WETH',
                    symbol: 'WETH',
                    address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/2518/large/weth.png?1628852295',
                    price: '1840.141974105745',
                    priceChange: '44.50441594814379',
                    balanceUsd: '0.135901975145425',
                    balance: '7.3854070532503e-05',
                },
            ],
            nfts: [],
            integrations: [
                {
                    integrationId: 'ANKR_ABNBC_STAKE__0x52f24a5e03aee338da5fd9df68d2b6fae1178827',
                    chain: 'BSC',
                    name: 'Ankr aBNBc Stake',
                    platform: 'ANKR',
                    type: 'LIQUID_STAKING',
                    logo: 'https://www.ankr.com/docs/favicon/favicon.ico',
                    url: 'https://www.ankr.com/',
                    balances: [
                        {
                            name: 'BNB',
                            symbol: 'BNB',
                            address: null,
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1644979850',
                            price: '231.7273533061002',
                            priceChange: '7.328542197451725',
                            balanceUsd: '23.18203705406041',
                            balance: '0.10004014080909171',
                            balanceType: 'DEPOSIT',
                            unlockTimestamp: null,
                        },
                    ],
                    stakingType: 'LIQUID_DELEGATION',
                    validator: {
                        name: null,
                        status: null,
                        address: null,
                        commission_percentage: null,
                    },
                },
            ],
        },
        error: '',
    },
    polygon: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'Polygon',
                    symbol: 'MATIC',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912',
                    price: '0.6735163803271601',
                    priceChange: '0.04854006962512136',
                    balanceUsd: '4.587120366235212',
                    balance: '6.810703496189686',
                },
                {
                    name: 'WETH',
                    symbol: 'WETH',
                    address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/2518/large/weth.png?1628852295',
                    price: '1839.5820209915014',
                    priceChange: '43.94446283390016',
                    balanceUsd: '1.9309633262370773',
                    balance: '0.001049675037156714',
                },
                {
                    name: 'Aave',
                    symbol: 'AAVE',
                    address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png?1601374110',
                    price: '94.87653640963538',
                    priceChange: '13.368523327494017',
                    balanceUsd: '1.474617029307379',
                    balance: '0.015542483791151774',
                },
                {
                    name: 'Wrapped Bitcoin',
                    symbol: 'WBTC',
                    address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
                    decimals: 8,
                    logo: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744',
                    price: '35323.89126444341',
                    priceChange: '1068.9508341166875',
                    balanceUsd: '0.35323891264443413',
                    balance: '1e-05',
                },
            ],
            nfts: [],
            integrations: [
                {
                    integrationId: 'POLYGON_LIQUID_STAKING__0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6',
                    chain: 'POLYGON',
                    name: 'Stader Liquid Staking Polygon',
                    platform: 'STADER',
                    type: 'STAKING',
                    logo: 'https://raw.githubusercontent.com/stader-labs/assets/main/terra/whSD.png',
                    url: 'https://www.staderlabs.com/',
                    balances: [
                        {
                            name: 'Polygon',
                            symbol: 'MATIC',
                            address: null,
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912',
                            price: '0.6735163803271601',
                            priceChange: '0.04854006962512136',
                            balanceUsd: '0.8041490649373539',
                            balance: '1.193956210161866',
                            balanceType: 'DEPOSIT',
                            unlockTimestamp: null,
                        },
                    ],
                    stakingType: 'DEPOSIT',
                    validator: {
                        name: null,
                        status: null,
                        address: null,
                        commission_percentage: null,
                    },
                },
                {
                    integrationId: 'POL_AAVE_BORROW_V3__0x794a61358D6845594F94dc1DB02A252b5b4814aD',
                    chain: 'POLYGON',
                    name: 'Polygon Aave Borrow and Lending V3',
                    platform: 'AAVE',
                    type: 'BORROW_AND_LENDING',
                    logo: 'https://app.aave.com/icons/tokens/aave.svg',
                    url: 'https://app.aave.com/',
                    balances: [
                        {
                            name: 'Wrapped Matic',
                            symbol: 'WMATIC',
                            address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/14073/large/matic.png?1628852392',
                            price: '0.6710444835372226',
                            priceChange: '0.04809887613027031',
                            balanceUsd: '3.355695344581771',
                            balance: '5.000704762362646',
                            balanceType: 'DEPOSIT_COLLATERAL',
                            unlockTimestamp: null,
                        },
                        {
                            name: 'Stader MaticX',
                            symbol: 'MATICX',
                            address: '0xfa68fb4628dff1028cfec22b4162fccd0d45efb6',
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/25383/large/maticx.png?1674714297',
                            price: '0.7287901138134667',
                            priceChange: '0.04398676721938477',
                            balanceUsd: '0.8016958918002691',
                            balance: '1.100036727454103',
                            balanceType: 'BORROW',
                            unlockTimestamp: null,
                        },
                    ],
                    apr: 1.6685850163538043,
                    debtType: 'LOAN',
                    apy: '2.19750014368674',
                    healthRate: 67.27314497770057,
                },
                {
                    integrationId: 'POL_AAVE_BORROW_V2__0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf',
                    chain: 'POLYGON',
                    name: 'Polygon Aave Borrow and Lending V2',
                    platform: 'AAVE',
                    type: 'BORROW_AND_LENDING',
                    logo: 'https://app.aave.com/icons/tokens/aave.svg',
                    url: 'https://app.aave.com/',
                    balances: [
                        {
                            name: 'Wrapped Bitcoin',
                            symbol: 'WBTC',
                            address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
                            decimals: 8,
                            logo: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1548822744',
                            price: '35323.89126444341',
                            priceChange: '1068.9508341166875',
                            balanceUsd: '0.35323891264443413',
                            balance: '1e-05',
                            balanceType: 'BORROW',
                            unlockTimestamp: null,
                        },
                        {
                            name: 'Wrapped Matic',
                            symbol: 'WMATIC',
                            address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
                            decimals: 18,
                            logo: 'https://assets.coingecko.com/coins/images/14073/large/matic.png?1628852392',
                            price: '0.6710444835372226',
                            priceChange: '0.04809887613027031',
                            balanceUsd: '2.013263968002033',
                            balance: '3.00019449886493',
                            balanceType: 'DEPOSIT_COLLATERAL',
                            unlockTimestamp: null,
                        },
                    ],
                    apr: 0.3865106856565747,
                    debtType: 'LOAN',
                    apy: '0.48285457044883123',
                    healthRate: 74.93488056788348,
                },
            ],
        },
        error: '',
    },
    fantom: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'Fantom',
                    symbol: 'FTM',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png?1669652346',
                    price: '0.2544729532947271',
                    priceChange: '0.019999422873860667',
                    balanceUsd: '1.0178918131789083',
                    balance: '4.0',
                },
            ],
            nfts: [],
            integrations: [],
        },
        error: '',
    },
    avalanche: emptyBalanceMockData,
};

const mockBalanceDataBySendTest = {
    avalanche: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
                    price: '21.473881918021284',
                    priceChange: '-0.31563323718329883',
                    balanceUsd: '2.1473881918021287',
                    balance: '0.1',
                },
                {
                    name: 'USDC',
                    symbol: 'USDC',
                    address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
                    decimals: 6,
                    logo: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
                    price: '0.9992418554279857',
                    priceChange: '-0.0006581513448562504',
                    balanceUsd: '0.09992418554279858',
                    balance: '0.1',
                },
                {
                    name: 'Storm',
                    symbol: 'STORM',
                    address: '0x6afd5a1ea4b793cc1526d6dc7e99a608b356ef7b',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/18170/large/nFiYZ2xO_400x400.png?1696517670',
                    price: '0.0014557002331391314',
                    priceChange: '-6.0332342080064976e-05',
                    balanceUsd: '0.014557002331391313',
                    balance: '10.0',
                },
            ],
            nfts: [],
            integrations: [],
        },
        error: '',
    },
    eth: emptyBalanceMockData,
    polygon: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'Polygon',
                    symbol: 'MATIC',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png?1698233745',
                    price: '0.7828426484426216',
                    priceChange: '0.01826974158287986',
                    balanceUsd: '0.7828426484426216',
                    balance: '1.0',
                },
            ],
            nfts: [],
            integrations: [],
        },
        error: '',
    },
};

const mockBalanceDataBySwapTest = {
    eth: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'Oraichain',
                    symbol: 'ORAI',
                    address: '0x4c11249814f11b9346808179cf06e71ac328c1b5',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/12931/large/orai.png?1696512718',
                    price: '7.344306642945768',
                    priceChange: '0.11643066334202157',
                    balanceUsd: '21.029913946122438',
                    balance: '2.863430813625101',
                },
                {
                    name: 'dYdX',
                    symbol: 'ETHDYDX',
                    address: '0x92d6c1e31e14520e676a687f0a93788b716beff5',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/17500/large/hjnIm9bV.jpg?1696517040',
                    price: '3.1046807336583626',
                    priceChange: '0.1531920274073988',
                    balanceUsd: '122.25925593967644',
                    balance: '39.37901073506316',
                },
                {
                    name: 'Tether',
                    symbol: 'USDT',
                    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                    decimals: 6,
                    logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1696501661',
                    price: '0.9982622405505932',
                    priceChange: '-0.0020187709409722476',
                    balanceUsd: '23.220747682028243',
                    balance: '23.26117',
                },
                {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
                    price: '2305.5055751401324',
                    priceChange: '63.4243025752603',
                    balanceUsd: '22.64692851431036',
                    balance: '0.00982297711985964',
                },
            ],
            nfts: [],
            integrations: [],
        },
        error: '',
    },
    avalanche: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369',
                    price: '21.473881918021284',
                    priceChange: '-0.31563323718329883',
                    balanceUsd: '2.1473881918021287',
                    balance: '15.1',
                },
                {
                    name: 'USDC',
                    symbol: 'USDC',
                    address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
                    decimals: 6,
                    logo: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
                    price: '0.9992418554279857',
                    priceChange: '-0.0006581513448562504',
                    balanceUsd: '0.09992418554279858',
                    balance: '20.1',
                },
                {
                    name: 'Storm',
                    symbol: 'STORM',
                    address: '0x6afd5a1ea4b793cc1526d6dc7e99a608b356ef7b',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/18170/large/nFiYZ2xO_400x400.png?1696517670',
                    price: '0.0014557002331391314',
                    priceChange: '-6.0332342080064976e-05',
                    balanceUsd: '0.014557002331391313',
                    balance: '35.0',
                },
                {
                    name: 'Frax',
                    symbol: 'FRAX',
                    address: '0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/13422/large/ethCanonicalFRAX.png?1669277108',
                    price: '10',
                    priceChange: '0',
                    balanceUsd: '100',
                    balance: '10.0',
                },
            ],
            nfts: [],
            integrations: [],
        },
        error: '',
    },
    arbitrum: {
        ok: true,
        data: {
            tokens: [
                {
                    name: 'GMX',
                    symbol: 'GMX',
                    address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png?1696517814',
                    price: '44.50635394453711',
                    priceChange: '1.371117500289337',
                    balanceUsd: '242.86402245118953',
                    balance: '5.436244379764906',
                },
                {
                    name: '',
                    symbol: 'ARB',
                    address: '0x912ce59144191c1204e64559fe8253a0e49e6548',
                    decimals: 18,
                    logo: '',
                    price: '1.1190745597229164',
                    priceChange: '0.02859101948364806',
                    balanceUsd: '23.480300410319767',
                    balance: '20.948392275648835',
                },
                {
                    name: 'Wrapped Bitcoin',
                    symbol: 'WBTC',
                    address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
                    decimals: 8,
                    logo: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1696507857',
                    price: '43882.42848262222',
                    priceChange: '1719.287857467396',
                    balanceUsd: '11.468672683933317',
                    balance: '0.00026135',
                },
                {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    address: null,
                    decimals: 18,
                    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
                    price: '2243.1116620151697',
                    priceChange: '53.50405242635725',
                    balanceUsd: '33.03240884364879',
                    balance: '0.014666513409906596',
                },
            ],
            nfts: [],
            integrations: [],
        },
        error: '',
    },
};

const marketCapMockData = {
    polygon_matic: {
        ok: true,
        data: {
            'matic-network': {
                marketCap: 8417707680,
                circulatingSupply: 9260335235.536646,
                usd: {
                    price: 0.909096,
                    priceChange24h: -0.03318739088515421,
                    priceChange24hPct: -3.52202,
                    volumeChange24h: 1133505125,
                },
                btc: {
                    price: 0.00002442,
                    priceChange24h: -0.000001560120823913,
                    priceChange24hPct: -6.00419,
                    volumeChange24h: 30453,
                },
            },
        },
        error: '',
    },
    polygon_1inch: {
        ok: true,
        data: {
            '0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f': {
                usd: 0.371191,
                btc: 0.0000099,
            },
        },
        error: [],
    },
};

export {
    mockBalanceData,
    marketCapMockData,
    mockBalanceDataBySendTest,
    mockBalanceDataBySwapTest,
    emptyBalanceMockData,
    errorGetBalanceMockData,
    EVM_NETWORKS,
    errorEstimateSwap,
};
