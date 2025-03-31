const mockAddressFrom = 'osmo1aascfnuh7dpup8cmyph2l0wgee9d2lch9y4le3';
const mockTxIdSendReject = '23680';
const mockRequestIdSendReject = 'f6f79e56-2e04-41b1-a69d-4aaa9606d56b';

const mockPostTransactionsRouteSwapRejectKeplr = {
    ok: true,
    data: [
        {
            id: mockTxIdSendReject,
            requestID: mockRequestIdSendReject,
            index: '0',
            txHash: null,
            ecosystem: 'COSMOS',
            module: 'superSwap',
            status: null,
            parameters: null,
            account: mockAddressFrom,
            chainId: 'osmosis',
            metaData: null,
            createdAt: '2024-10-03T08:26:42.472Z',
            updatedAt: '2024-10-03T08:26:42.472Z',
        },
    ],
    error: '',
};

const mockGetSwapTx = {
    ok: true,
    data: [
        {
            ecosystem: 'cosmos',
            transaction: {
                chainId: 'osmosis-1',
                typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                value: {
                    contract: 'osmo15jw7xccxaxk30lf4xgag8f7aeg53pgkh74e39rv00xfnymldjaas2fk627',
                    msg: {
                        swap_with_action: {
                            swap_msg: {
                                token_out_min_amount: '11791',
                                path: [
                                    {
                                        pool_id: '1',
                                        token_out_denom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                                    },
                                ],
                            },
                            after_swap_action: {
                                bank_send: {
                                    receiver: mockAddressFrom,
                                },
                            },
                            local_fallback_address: mockAddressFrom,
                        },
                    },
                    funds: [
                        {
                            denom: 'uosmo',
                            amount: '100000',
                        },
                    ],
                },
                gas: '650000000000',
                gasPrice: '0.25uosmo',
            },
        },
    ],
    error: '',
    errorData: null,
};

const mockSuperswapPutTx = {
    ok: true,
    data: {
        id: mockTxIdSendReject,
        requestID: mockRequestIdSendReject,
        index: '0',
        txHash: null,
        ecosystem: 'COSMOS',
        module: 'superSwap',
        status: 'IN PROGRESS',
        parameters: {
            gas: '650000000000',
            value: {
                msg: {
                    swap_with_action: {
                        swap_msg: {
                            path: [
                                {
                                    pool_id: '1',
                                    token_out_denom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                                },
                            ],
                            token_out_min_amount: '11791',
                        },
                        after_swap_action: {
                            bank_send: {
                                receiver: mockAddressFrom,
                            },
                        },
                        local_fallback_address: mockAddressFrom,
                    },
                },
                funds: [
                    {
                        denom: 'uosmo',
                        amount: '100000',
                    },
                ],
                contract: 'osmo15jw7xccxaxk30lf4xgag8f7aeg53pgkh74e39rv00xfnymldjaas2fk627',
            },
            chainId: 'osmosis-1',
            typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
            gasPrice: '0.25uosmo',
        },
        account: mockAddressFrom,
        chainId: 'osmosis',
        metaData: {
            type: 'DEX',
            action: 'formatTransactionForSign',
            params: {
                net: 'osmosis',
                memo: '',
                type: 'dex',
                toNet: 'osmosis',
                amount: '0.1',
                fromNet: 'osmosis',
                routeId: '239eefe5-800c-4655-9bce-9180e869a6b7',
                toToken: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                dstAmount: '0.012156',
                fromToken: 'uosmo',
                serviceId: 'squid',
                startTime: 1727944002380,
                outputAmount: '0.012156',
                ownerAddresses: {
                    sei: 'sei1eksvfd7400dr6fvkdh4mshfkukm9u8aqqu2yt3',
                    dydx: 'dydx1eksvfd7400dr6fvkdh4mshfkukm9u8aqyf4kd8',
                    kava: 'kava16luyu67vmk6jrzwzanemcf9f5hha6ms6a43tg4',
                    saga: 'saga1eksvfd7400dr6fvkdh4mshfkukm9u8aqnrzq2k',
                    akash: 'akash1eksvfd7400dr6fvkdh4mshfkukm9u8aqqtk452',
                    axelar: 'axelar1eksvfd7400dr6fvkdh4mshfkukm9u8aqf7d6x3',
                    kujira: 'kujira1eksvfd7400dr6fvkdh4mshfkukm9u8aquce2q6',
                    stride: 'stride1eksvfd7400dr6fvkdh4mshfkukm9u8aqwmmweu',
                    terra2: 'terra1vsqz86e7ew6j4d5rz05s8cl4ps3vdajmw2kaj0',
                    neutron: 'neutron1eksvfd7400dr6fvkdh4mshfkukm9u8aqf0jshh',
                    osmosis: mockAddressFrom,
                    celestia: 'celestia1eksvfd7400dr6fvkdh4mshfkukm9u8aqu62zha',
                    fetchhub: 'fetch1eksvfd7400dr6fvkdh4mshfkukm9u8aq7djk08',
                    stargaze: 'stars1eksvfd7400dr6fvkdh4mshfkukm9u8aqevv0xp',
                    bandchain: 'band1h7h3u44f2dwy42vdxl0r0gfee6dlgh3scspvju',
                    cosmoshub: 'cosmos1eksvfd7400dr6fvkdh4mshfkukm9u8aqdsmjds',
                    dymension: 'dym1fhfghmj3xh79mwe43f5t49q6t0uw024jskll4n',
                    injective: 'inj1fhfghmj3xh79mwe43f5t49q6t0uw024jgzyaz9',
                    secretnetwork: 'secret1ytpnwlvz69z7u8rd4yqa8dxr33ygl7n28t2kpq',
                    cryptoorgchain: 'cro1vu5lm0lcjmlz2lga7fy4ra9zvs3w3ar94zp9tc',
                },
                receiverAddress: {
                    osmosis: mockAddressFrom,
                },
                slippageTolerance: 5,
            },
            tokens: {
                to: {
                    id: 'osmosis:tokens__ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2:ATOM',
                    base: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    name: 'IBC - Cosmos Hub Atom',
                    chain: 'osmosis',
                    price: '4.36481',
                    symbol: 'ATOM',
                    account: 'citadel 1',
                    address: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
                    balance: '0.036898',
                    dataType: 'tokens',
                    decimals: 6,
                    provider: 'Pulsar',
                    selected: false,
                    uniqueId:
                        'citadel 1__osmo1eksvfd7400dr6fvkdh4mshfkukm9u8aq9tgzmz__osmosis:tokens__ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2:ATOM',
                    verified: false,
                    chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
                    updatedAt: 1727943936361,
                    balanceUsd: '0.1602298826',
                    priceChange: '-0.169116',
                    accountAddress: mockAddressFrom,
                },
                from: {
                    id: 'osmosis:tokens__native:OSMO',
                    base: 'uosmo',
                    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
                    name: 'Osmosis',
                    chain: 'osmosis',
                    price: '0.533161',
                    symbol: 'OSMO',
                    account: 'citadel 1',
                    address: 'uosmo',
                    balance: '0.422378',
                    dataType: 'tokens',
                    decimals: 6,
                    provider: 'Pulsar',
                    selected: false,
                    uniqueId: 'citadel 1__osmo1eksvfd7400dr6fvkdh4mshfkukm9u8aq9tgzmz__osmosis:tokens__native:OSMO',
                    verified: false,
                    chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
                    updatedAt: 1727943936361,
                    balanceUsd: '0.2247547236',
                    priceChange: '-0.033136',
                    accountAddress: mockAddressFrom,
                },
            },
            notificationTitle: 'SWAP 0.1 OSMO',
            notificationDescription: 'For 0.012156 ATOM',
        },
        createdAt: '2024-10-03T08:26:42.472Z',
        updatedAt: '2024-10-03T08:26:47.953Z',
    },
    error: '',
};

export { mockPostTransactionsRouteSwapRejectKeplr, mockGetSwapTx, mockSuperswapPutTx };
