import { TEST_CONST, getTestVar } from '../../envHelper';
import { mockAddressTo, txHashFromProxyMock } from './constantsMockTxManager';

const mockAddressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
const mockTxId = '4765';
const mockRequestId = 'f6f79e56-2e04-41b1-a69d-4aaa9606d56a';

const mockPostTransactionsRouteSendMockTx = {
    ok: true,
    data: [
        {
            id: mockTxId,
            requestID: mockRequestId,
            index: '0',
            txHash: null,
            ecosystem: 'EVM',
            module: 'Zomet - Send',
            status: 'IN PROGRESS',
            parameters: {
                token: {
                    id: 'polygon:asset__native:MATIC',
                    net: 'polygon',
                    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
                    name: 'MATIC Native Token',
                    chain: 'polygon',
                    price: '0.8531747555103706',
                    symbol: 'MATIC',
                    address: null,
                    balance: '6.410624815464208',
                    decimals: 18,
                    chainLogo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
                    balanceUsd: '5.410930625',
                    priceChange: '-0.000342946031245849',
                    coingecko_id: 'matic-network',
                },
                amount: '0.001',
                toAddress: mockAddressTo,
                fromAddress: mockAddressFrom,
            },
            account: mockAddressFrom,
            chainId: '137',
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

const mockPostTransactionsWsByCreateEventSendMockTx = {
    id: mockTxId,
    requestID: mockRequestId,
    index: '0',
    txHash: null,
    ecosystem: 'EVM',
    module: 'Zomet - Send',
    status: 'IN PROGRESS',
    parameters: {
        token: {
            id: 'polygon:asset__native:MATIC',
            net: 'polygon',
            logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
            name: 'MATIC Native Token',
            chain: 'polygon',
            price: '0.8531747555103706',
            symbol: 'MATIC',
            address: null,
            balance: '6.410624815464208',
            decimals: 18,
            chainLogo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
            balanceUsd: '5.410930625',
            priceChange: '-0.000342946031245849',
            coingecko_id: 'matic-network',
        },
        amount: '0.001',
        toAddress: mockAddressTo,
        fromAddress: mockAddressFrom,
    },
    account: mockAddressFrom,
    chainId: '137',
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

const mockPutTransactionsRouteSendMockTx = {
    ok: true,
    data: {
        id: mockTxId,
        requestID: mockRequestId,
        index: '0',
        txHash: txHashFromProxyMock,
        ecosystem: 'EVM',
        module: 'Zomet - Send',
        status: 'IN PROGRESS',
        parameters: {
            token: {
                id: 'polygon:asset__native:MATIC',
                logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
                name: 'MATIC Native Token',
                chain: 'polygon',
                price: '0.8531747555103706',
                symbol: 'MATIC',
                address: null,
                balance: '6.410624815464208',
                decimals: 18,
                chainLogo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
                balanceUsd: '72.93879395',
                priceChange: '7.18186037000271',
            },
            amount: '0.001',
            toAddress: mockAddressTo,
            fromAddress: mockAddressFrom,
        },
        account: mockAddressFrom,
        chainId: '137',
        metaData: {
            type: 'Transfer',
            action: 'prepareTransaction',
            explorerLink: `https://polygonscan.com/tx/${txHashFromProxyMock}`,
            successCallback: {
                action: 'CLEAR_AMOUNTS',
            },
        },
        createdAt: '2024-02-09T09:29:03.473Z',
        updatedAt: '2024-02-09T09:29:14.308Z',
    },
    error: '',
};

const mockPutTransactionsWsByUpdateTransactionEventInProgressSendMockTx = {
    id: mockTxId,
    requestID: mockRequestId,
    index: '0',
    txHash: txHashFromProxyMock,
    ecosystem: 'EVM',
    module: 'Zomet - Send',
    status: 'IN PROGRESS',
    parameters: {
        token: {
            id: 'polygon:asset__native:MATIC',
            net: 'polygon', // TODO this param is only in WS response, but didn`t in http. Need analyze
            logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
            name: 'MATIC Native Token',
            chain: 'polygon',
            price: '0.8531747555103706',
            symbol: 'MATIC',
            address: null,
            balance: '6.410624815464208',
            decimals: 18,
            chainLogo: 'https://cryptologos.cc/logos/polygon-matic-logo.png?v=025',
            balanceUsd: '5.410930625',
            priceChange: '-0.000342946031245849',
            coingecko_id: 'matic-network',
        },
        amount: '0.001',
        toAddress: mockAddressTo,
        fromAddress: mockAddressFrom,
    },
    account: mockAddressFrom,
    chainId: '137',
    metaData: {
        type: 'Transfer',
        action: 'prepareTransaction',
        explorerLink: `https://polygonscan.com/tx/${txHashFromProxyMock}`,
        successCallback: {
            action: 'CLEAR_AMOUNTS',
        },
    },
    createdAt: '2024-02-09T14:10:59.566Z',
    updatedAt: '2024-02-09T14:11:28.364Z',
};

export {
    mockPostTransactionsRouteSendMockTx,
    mockPostTransactionsWsByCreateEventSendMockTx,
    mockPutTransactionsRouteSendMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendMockTx,
};
