import { TEST_CONST, getTestVar } from 'tests/envHelper';
import { COSMOS_WALLETS_BY_PROTOCOL_SEED, MEMO_BY_KEPLR_TEST } from '../constants';

const mockAddressFrom3 = getTestVar(TEST_CONST.COSMOS_ADDRESS_TX);
const mockTxIdSendRejectKeplr = '4767';
const mockRequestIdSendRejectKeplr = 'aaa79e56-2e04-41b1-a69d-4aaa9606d56b';

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

export {
    mockPostTransactionsRouteSendRejectKeplr,
    mockPostTransactionsWsByCreateEventSendRejectKeplr,
    mockPutTransactionsRouteSendRejectKeplr,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendRejectKeplr,
};
