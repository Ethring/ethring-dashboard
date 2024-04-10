import { TEST_CONST, getTestVar } from '../../envHelper';
import { mockAddressTo } from './constantsMockTxManager';

const mockAddressFrom2 = getTestVar(TEST_CONST.ETH_ADDRESS_TX_2);
const mockTxIdSendReject = '4766';
const mockRequestIdSendReject = 'f6f79e56-2e04-41b1-a69d-4aaa9606d56b';

const mockPostTransactionsRouteSendReject = {
    ok: true,
    data: [
        {
            id: mockTxIdSendReject,
            requestID: mockRequestIdSendReject,
            index: '0',
            txHash: null,
            ecosystem: 'EVM',
            module: 'Zomet - Send',
            status: 'IN PROGRESS',
            parameters: {
                token: {
                    id: 'avalanche:asset__native:AVAX',
                    net: 'avalanche',
                    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
                    name: 'Avalanche Native Token',
                    chain: 'avalanche',
                    price: '38.74444165272416',
                    symbol: 'AVAX',
                    address: null,
                    balance: '0.8544960208245843',
                    decimals: 18,
                    chainLogo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
                    balanceUsd: '33.07174196',
                    priceChange: '-1.6871162478902946',
                    coingecko_id: 'avalanche-2',
                },
                amount: '0.001',
                toAddress: mockAddressTo,
                fromAddress: mockAddressFrom2,
            },
            account: mockAddressFrom2,
            chainId: '43114',
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

const mockPostTransactionsWsByCreateEventSendReject = {
    id: mockTxIdSendReject,
    requestID: mockRequestIdSendReject,
    index: '0',
    txHash: null,
    ecosystem: 'EVM',
    module: 'Zomet - Send',
    status: 'IN PROGRESS',
    parameters: {
        token: {
            id: 'avalanche:asset__native:AVAX',
            net: 'avalanche',
            logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
            name: 'Avalanche Native Token',
            chain: 'avalanche',
            price: '38.74444165272416',
            symbol: 'AVAX',
            address: null,
            balance: '0.8544960208245843',
            decimals: 18,
            chainLogo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
            balanceUsd: '33.07174196',
            priceChange: '-1.6871162478902946',
            coingecko_id: 'avalanche-2',
        },
        amount: '0.001',
        toAddress: mockAddressTo,
        fromAddress: mockAddressFrom2,
    },
    account: mockAddressFrom2,
    chainId: '43114',
    metaData: {
        type: 'Transfer',
        action: 'prepareTransaction',
        successCallback: {
            action: 'CLEAR_AMOUNTS',
        },
    },
    createdAt: '2024-02-11T16:23:39.568Z',
    updatedAt: '2024-02-11T16:23:39.568Z',
};

const mockPutTransactionsRouteSendReject = {
    ok: true,
    data: {
        id: mockTxIdSendReject,
        requestID: mockRequestIdSendReject,
        index: '0',
        txHash: null,
        ecosystem: 'EVM',
        module: 'Zomet - Send',
        status: 'REJECTED',
        parameters: {
            token: {
                id: 'avalanche:asset__native:AVAX',
                net: 'avalanche',
                logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
                name: 'Avalanche Native Token',
                chain: 'avalanche',
                price: '38.735379930425296',
                symbol: 'AVAX',
                address: null,
                balance: '0.1',
                decimals: 18,
                chainLogo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
                balanceUsd: '3.875895739',
                priceChange: '-1.1678499147095422',
                coingecko_id: 'avalanche-2',
            },
            amount: '0.001',
            toAddress: mockAddressTo,
            fromAddress: mockAddressFrom2,
        },
        account: mockAddressFrom2,
        chainId: '43114',
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

const mockPutTransactionsWsByUpdateTransactionEventInProgressSendReject = {
    account: mockAddressFrom2,
    chainId: '137',
    createdAt: '2024-02-09T14:10:59.566Z',
    ecosystem: 'EVM',
    id: mockTxIdSendReject,
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
        fromAddress: mockAddressFrom2,
        toAddress: mockAddressTo,
        token: {
            address: null,
            balance: '0.1',
            balanceUsd: '5.410930625',
            chain: 'avalanche',
            chainLogo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
            coingecko_id: 'avalanche-2',
            decimals: 18,
            id: 'avalanche:asset__native:AVAX',
            logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png?v=025',
            name: 'Avalanche Native Token',
            net: 'avalanche', // TODO this param is only in WS response, but didn`t in http. Need analyze
            price: '38.735379930425296',
            priceChange: '-0.000342946031245849',
            symbol: 'AVAX',
        },
    },
    requestID: mockRequestIdSendReject,
    status: 'REJECTED',
    txHash: null,
    updatedAt: '2024-02-09T14:11:28.364Z',
};

export {
    mockPostTransactionsRouteSendReject,
    mockPostTransactionsWsByCreateEventSendReject,
    mockPutTransactionsRouteSendReject,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendReject,
};
