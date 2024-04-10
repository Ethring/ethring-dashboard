import { TEST_CONST, getTestVar } from 'tests/envHelper';
import { COSMOS_WALLETS_BY_PROTOCOL_SEED, MEMO_BY_KEPLR_TEST } from '../constants';

const mockAddressFrom3 = getTestVar(TEST_CONST.COSMOS_ADDRESS_TX);
const mockTxIdSendRejectKeplr = '4767';
const mockRequestIdSendRejectKeplr = 'aaa79e56-2e04-41b1-a69d-4aaa9606d56b';

const mockTxIdSwapRejectKeplr = '8166';
const mockRequestIdSwapRejectKeplr = '98724c8e-7fb6-4602-8d69-1717e5b832fc';

const mockPostTransactionsRouteSendRejectKeplr = {
    ok: true,
    data: [
        {
            id: mockTxIdSendRejectKeplr,
            requestID: mockRequestIdSendRejectKeplr,
            index: '0',
            txHash: null,
            ecosystem: 'COSMOS',
            module: 'Zomet - Send',
            status: 'IN PROGRESS',
            parameters: {
                token: {
                    id: 'cosmoshub:tokens__native:ATOM',
                    net: 'cosmoshub',
                    base: 'uatom',
                    logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Cosmos%20Hub.png',
                    name: 'Cosmos Hub Atom',
                    chain: 'cosmoshub',
                    price: '10.3451',
                    images: [
                        {
                            png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                            svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                        },
                    ],
                    symbol: 'ATOM',
                    address: 'uatom',
                    balance: '0.061791',
                    display: 'atom',
                    decimals: 6,
                    chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    logo_URIs: {
                        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                    },
                    balanceUsd: '0.639234796',
                    denom_units: [
                        {
                            denom: 'uatom',
                            exponent: 0,
                        },
                        {
                            denom: 'atom',
                            exponent: 6,
                        },
                    ],
                    description: 'The native staking and governance token of the Cosmos Hub.',
                    priceChange: '0.398611',
                    coingecko_id: 'cosmos',
                },
                memo: MEMO_BY_KEPLR_TEST,
                amount: '0.001',
                toAddress: COSMOS_WALLETS_BY_PROTOCOL_SEED.cosmoshub,
                fromAddress: mockAddressFrom3,
            },
            account: mockAddressFrom3,
            chainId: 'cosmoshub',
            metaData: {
                type: 'Transfer',
                action: 'prepareTransaction',
                successCallback: {
                    action: 'CLEAR_AMOUNTS',
                },
            },
            createdAt: '2024-02-11T16:23:39.568Z',
            updatedAt: '2024-02-11T16:23:39.568Z',
        },
    ],
    error: '',
};

const mockPostTransactionsWsByCreateEventSendRejectKeplr = {
    account: mockAddressFrom3,
    chainId: 'cosmoshub',
    createdAt: '2024-02-11T16:23:39.568Z',
    ecosystem: 'COSMOS',
    id: mockTxIdSendRejectKeplr,
    index: '0',
    metaData: {
        action: 'prepareTransaction',
        successCallback: {
            action: 'CLEAR_AMOUNTS',
        },
        type: 'Transfer',
    },
    module: 'Zomet - Send',
    parameters: {
        amount: '0.001',
        memo: MEMO_BY_KEPLR_TEST,
        fromAddress: mockAddressFrom3,
        toAddress: COSMOS_WALLETS_BY_PROTOCOL_SEED.cosmoshub,
        token: {
            address: 'uatom',
            balance: '0.8544960208245843',
            balanceUsd: '33.07174196',
            base: 'uatom', // TODO WTF THIS FLAG???
            chain: 'cosmoshub',
            chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
            coingecko_id: 'cosmos',
            decimals: 6,
            denom_units: [
                {
                    denom: 'uatom',
                    exponent: 0,
                },
                {
                    denom: 'atom',
                    exponent: 6,
                },
            ],
            description: 'The native staking and governance token of the Cosmos Hub.',
            display: 'atom',
            id: 'cosmoshub:tokens__native:ATOM',
            images: [
                {
                    png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                },
            ],
            logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Cosmos%20Hub.png',
            logo_URIs: {
                png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
            },
            name: 'Cosmos Hub Atom',
            net: 'cosmoshub',
            price: '10.3451',
            priceChange: '-1.6871162478902946',
            symbol: 'ATOM',
        },
    },
    requestID: mockRequestIdSendRejectKeplr,
    status: 'IN PROGRESS',
    txHash: null,
    updatedAt: '2024-02-11T16:23:39.568Z',
};

const mockPutTransactionsRouteSendRejectKeplr = {
    ok: true,
    data: {
        id: mockTxIdSendRejectKeplr,
        requestID: mockRequestIdSendRejectKeplr,
        index: '0',
        txHash: null,
        ecosystem: 'COSMOS',
        module: 'Zomet - Send',
        status: 'REJECTED',
        parameters: {
            token: {
                id: 'cosmoshub:tokens__native:ATOM',
                net: 'cosmoshub',
                base: 'uatom',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Cosmos%20Hub.png',
                name: 'Cosmos Hub Atom',
                chain: 'cosmoshub',
                price: '10.3451',
                images: [
                    {
                        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                    },
                ],
                symbol: 'ATOM',
                address: 'uatom',
                balance: '0.061791',
                display: 'atom',
                decimals: 6,
                chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                logo_URIs: {
                    png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                },
                balanceUsd: '0.639234796',
                denom_units: [
                    {
                        denom: 'uatom',
                        exponent: 0,
                    },
                    {
                        denom: 'atom',
                        exponent: 6,
                    },
                ],
                description: 'The native staking and governance token of the Cosmos Hub.',
                priceChange: '0.398611',
                coingecko_id: 'cosmos',
            },
            memo: MEMO_BY_KEPLR_TEST,
            amount: '0.001',
            toAddress: COSMOS_WALLETS_BY_PROTOCOL_SEED.cosmoshub,
            fromAddress: mockAddressFrom3,
        },
        account: mockAddressFrom3,
        chainId: 'cosmoshub',
        metaData: {
            type: 'Transfer',
            action: 'prepareTransaction',
            successCallback: {
                action: 'CLEAR_AMOUNTS',
            },
        },
        createdAt: '2024-02-09T09:29:03.473Z',
        updatedAt: '2024-02-09T09:29:14.308Z',
    },
    error: '',
};

const mockPutTransactionsWsByUpdateTransactionEventInProgressSendRejectKeplr = {
    account: mockAddressFrom3,
    chainId: 'cosmoshub',
    createdAt: '2024-02-09T14:10:59.566Z',
    ecosystem: 'COSMOS',
    id: mockTxIdSendRejectKeplr,
    index: '0',
    metaData: {
        action: 'prepareTransaction',
        successCallback: {
            action: 'CLEAR_AMOUNTS',
        },
        type: 'Transfer',
    },
    module: 'Zomet - Send',
    parameters: {
        memo: MEMO_BY_KEPLR_TEST,
        amount: '0.001',
        fromAddress: mockAddressFrom3,
        toAddress: COSMOS_WALLETS_BY_PROTOCOL_SEED.cosmoshub,
        token: {
            address: 'uatom',
            balance: '0.8544960208245843',
            balanceUsd: '33.07174196',
            base: 'uatom', // TODO WTF THIS FLAG???
            chain: 'cosmoshub',
            chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
            coingecko_id: 'cosmos',
            decimals: 6,
            denom_units: [
                {
                    denom: 'uatom',
                    exponent: 0,
                },
                {
                    denom: 'atom',
                    exponent: 6,
                },
            ],
            description: 'The native staking and governance token of the Cosmos Hub.',
            display: 'atom',
            id: 'cosmoshub:tokens__native:ATOM',
            images: [
                {
                    png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                },
            ],
            logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Cosmos%20Hub.png',
            logo_URIs: {
                png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
            },
            name: 'Cosmos Hub Atom',
            net: 'cosmoshub',
            price: '10.3451',
            priceChange: '-1.6871162478902946',
            symbol: 'ATOM',
        },
    },
    requestID: mockRequestIdSendRejectKeplr,
    status: 'REJECTED',
    txHash: null,
    updatedAt: '2024-02-09T14:11:28.364Z',
};

const mockPostTransactionsRouteSwapRejectKeplr = {
    ok: true,
    data: [{
        id: mockTxIdSwapRejectKeplr,
        requestID: mockRequestIdSwapRejectKeplr,
        index: '0',
        txHash: null,
        ecosystem: 'COSMOS',
        module: 'swap',
        status: null,
        parameters: null,
        account: mockAddressFrom3,
        chainId: 'cosmoshub',
        metaData: null,
        createdAt: '2024-03-21T10:21:07.311Z',
        updatedAt: '2024-03-21T10:21:07.311Z',
    }],
    error: '',
};

const mockPostTransactionsWsByCreateEventSwapRejectKeplr = {
    id: mockTxIdSwapRejectKeplr,
    requestID: mockRequestIdSwapRejectKeplr,
    index: '0',
    txHash: 'FE36043EE0F3D01D710A214753D5F32A104C53AB56C89379C31F3B445B9D1574',
    ecosystem: 'COSMOS',
    module: 'swap',
    status: 'IN PROGRESS',
    parameters: {
        path: ['cosmoshub-4', 'osmosis-1', 'cosmoshub-4'],
        value: {
            memo: '{"wasm":{"contract":"osmo1qxydza7ctzh9fn7sq5gcf0run8c78wh0jj47f4t5dwc5302r2dnqsp4hu6","msg":{"swap_and_action":{"user_swap":{"swap_exact_asset_in":{"swap_venue_name":"osmosis-poolmanager","operations":[{"pool":"1400","denom_in":"uosmo","denom_out":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2"}]}},"min_asset":{"native":{"denom":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","amount":"114407"}},"timeout_timestamp":1711016768890722266,"post_swap_action":{"ibc_transfer":{"ibc_info":{"source_channel":"channel-0","receiver":"cosmos19a4sxyjf9mn0qzkck7rryx6mxyl85clqllzstu","memo":"","recover_address":"osmo19a4sxyjf9mn0qzkck7rryx6mxyl85clqhy3qaw"}}},"affiliates":[]}}}}',
            token: {
                denom: 'ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2F5008FC085218811CC',
                amount: '1000000',
            },
            sender: 'cosmos19a4sxyjf9mn0qzkck7rryx6mxyl85clqllzstu',
            receiver: 'osmo1qxydza7ctzh9fn7sq5gcf0run8c78wh0jj47f4t5dwc5302r2dnqsp4hu6',
            source_port: 'transfer',
            source_channel: 'channel-141',
            timeout_height: {},
            timeout_timestamp: 1711016768890714400,
        },
        chainId: 'cosmoshub-4',
        typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    },
    account: mockAddressFrom3,
    chainId: 'cosmoshub',
    metaData: {
        type: 'DEX',
        action: 'formatTransactionForSign',
        params: {
            net: 'cosmoshub',
            memo: null,
            amount: '1',
            tokens: {
                to: {
                    id: 'cosmoshub:tokens__native:ATOM',
                    net: 'cosmoshub',
                    base: 'uatom',
                    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    name: 'Cosmos Hub Atom Native Token',
                    chain: 'cosmoshub',
                    price: 11.75,
                    images: [
                        {
                            png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                            svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                        },
                    ],
                    symbol: 'ATOM',
                    address: 'uatom',
                    balance: '0.230606',
                    display: 'atom',
                    decimals: 6,
                    selected: false,
                    chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    logo_URIs: {
                        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
                    },
                    balanceUsd: '2.702316958',
                    denom_units: [
                        {
                            denom: 'uatom',
                            exponent: 0,
                        },
                        {
                            denom: 'atom',
                            exponent: 6,
                        },
                    ],
                    description: 'The native staking and governance token of the Cosmos Hub.',
                    priceChange: '0.498818',
                    coingecko_id: 'cosmos',
                },
                from: {
                    id: 'cosmoshub:tokens__ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2F5008FC085218811CC:OSMO',
                    base: 'ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2F5008FC085218811CC',
                    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
                    name: 'IBC - Osmosis',
                    chain: 'cosmoshub',
                    price: '1.35721',
                    symbol: 'OSMO',
                    address: 'ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2F5008FC085218811CC',
                    balance: '1',
                    decimals: 6,
                    selected: false,
                    chainLogo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
                    balanceUsd: '1.356406467',
                    priceChange: '0.077199',
                },
            },
            fromNet: 'cosmoshub',
            toToken: 'uatom',
            slippage: 1,
            fromToken: 'ibc/14F9BC3E44B8A9C1BE1FB08980FAB87034C9905EF17CF2F5008FC085218811CC',
            ownerAddresses: {
                juno: 'juno19a4sxyjf9mn0qzkck7rryx6mxyl85clqfdptvq',
                mars: 'mars19a4sxyjf9mn0qzkck7rryx6mxyl85clqzzmf78',
                terra2: 'terra1g29cl4ejy8js9l6rnevsanln324scrkvh7qcr2',
                osmosis: 'osmo19a4sxyjf9mn0qzkck7rryx6mxyl85clqhy3qaw',
                crescent: 'cre19a4sxyjf9mn0qzkck7rryx6mxyl85clqmh3473',
                stargaze: 'stars19a4sxyjf9mn0qzkck7rryx6mxyl85clqtr4dqd',
                cosmoshub: 'cosmos19a4sxyjf9mn0qzkck7rryx6mxyl85clqllzstu',
                injective: 'inj1695qevzf3nf6aklamstg26ukp3nwz0rn2c4qxn',
            },
            receiverAddress: null,
        },
        explorerLink: 'https://www.mintscan.io/cosmos/transactions/FE36043EE0F3D01D710A214753D5F32A104C53AB56C89379C31F3B445B9D1574',
        notificationTitle: 'SWAP 1 OSMO to ~0.115562 ATOM',
    },
    createdAt: '2024-03-21T10:21:07.311Z',
    updatedAt: '2024-03-21T10:21:21.709Z',
};


export {
    // Send tx mock
    mockPostTransactionsRouteSendRejectKeplr,
    mockPostTransactionsWsByCreateEventSendRejectKeplr,
    mockPutTransactionsRouteSendRejectKeplr,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendRejectKeplr,

    // Swap tx mock
    mockPostTransactionsRouteSwapRejectKeplr,
    mockPostTransactionsWsByCreateEventSwapRejectKeplr
};
