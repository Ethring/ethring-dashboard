import { TEST_CONST, getTestVar } from '../../envHelper';
import { mockAddressTo } from './constantsMockTxManager';

const ETH_ADDRESS_FROM = getTestVar(TEST_CONST.ETH_ADDRESS_TX_3);
const MOCK_TX_ID = '4894';
const MOCK_REQUEST_ID = 'b53a9e56-caa0-41e5-90d3-4aaa9606aaaa';
const module = 'superSwap';

const metaData = {
    type: 'DEX',
    action: 'formatTransactionForSign',
    params: {
        net: 'polygon',
        memo: '',
        type: 'dex',
        toNet: 'polygon',
        amount: '0.0265',
        fromNet: 'polygon',
        routeId: '33ded422-9754-4545-96c3-0e9c5aa23aa0',
        toToken: '0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f',
        dstAmount: '1.416757725820596736',
        fromToken: null,
        serviceId: 'odos',
        startTime: 1720091319312,
        outputAmount: '1.416757725820596736',
        ownerAddresses: {
            bsc: ETH_ADDRESS_FROM,
            eth: ETH_ADDRESS_FROM,
            base: ETH_ADDRESS_FROM,
            celo: ETH_ADDRESS_FROM,
            mode: ETH_ADDRESS_FROM,
            blast: ETH_ADDRESS_FROM,
            linea: ETH_ADDRESS_FROM,
            manta: ETH_ADDRESS_FROM,
            fantom: ETH_ADDRESS_FROM,
            gnosis: ETH_ADDRESS_FROM,
            mantle: ETH_ADDRESS_FROM,
            zksync: ETH_ADDRESS_FROM,
            polygon: ETH_ADDRESS_FROM,
            arbitrum: ETH_ADDRESS_FROM,
            optimism: ETH_ADDRESS_FROM,
            avalanche: ETH_ADDRESS_FROM,
        },
        receiverAddress: {
            polygon: ETH_ADDRESS_FROM,
        },
        slippageTolerance: 1,
    },
    tokens: {
        to: {
            id: 'polygon:tokens__0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f:1INCH',
            logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/1inch.png',
            name: '1inch',
            chain: 'polygon',
            price: '0.3568485574019455',
            symbol: '1INCH',
            address: '0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f',
            balance: '34.25421961436335',
            decimals: 18,
            selected: true,
            verified: false,
            chainLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Polygon.png',
            balanceUsd: '12.22356885',
            priceChange: '-0.03765187981180529',
        },
        from: {
            id: 'polygon:tokens__native:MATIC',
            net: 'polygon',
            logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Polygon.png',
            name: 'MATIC Native Token',
            chain: 'polygon',
            price: 0.515429,
            symbol: 'MATIC',
            address: null,
            balance: '4.387946899930048',
            decimals: 18,
            selected: true,
            verified: true,
            chainLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Polygon.png',
            balanceUsd: '2.250685179',
            priceChange: '-0.04635949779850457',
            coingecko_id: 'matic-network',
        },
    },
    notificationTitle: 'SWAP 0.0265 MATIC',
    notificationDescription: 'For 0.316757 1INCH',
};

const parameters = {
    to: '0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf',
    gas: 171602,
    data: '0x83bd37f9000000019c2c5fd7b07e95ee044ddeba0e97a665f142394f080de0b6b3a76400000813a955a53453b20000c49b0001a8376f53391a041C8236A232f7f019EA76eEd86d00000001a20BbcB5FE66Eda6Dd7F80F6EF8a403112D8b0F9000000000301020300060101020f0001010201ff00000000000000000000000000000000000260c206d80381445b38321361fe9ca0cf13190f0d500b1d8e8ef31e21c99d1db9a6444d3adf1270000000000000000000000000000000000000000000000000',
    from: ETH_ADDRESS_FROM,
    nonce: 34,
    value: '0x5e259c0e8c4000',
    chainId: 137,
    gasPrice: 35195162870,
};

const mockPostTransactionsRouteSuperSwapMockTx = {
    ok: true,
    data: [
        {
            id: MOCK_TX_ID,
            requestID: MOCK_REQUEST_ID,
            index: '0',
            txHash: null,
            ecosystem: 'EVM',
            module,
            status: null,
            parameters: null,
            account: ETH_ADDRESS_FROM,
            chainId: '137',
            metaData: null,
            createdAt: '2024-02-11T16:23:39.568Z',
            updatedAt: '2024-02-11T16:23:39.568Z',
        },
    ],
    error: '',
};

const mockPostTransactionsWsByCreateEventSuperSwapMockTx = {
    account: ETH_ADDRESS_FROM,
    chainId: '137',
    createdAt: '2024-02-11T16:23:39.568Z',
    ecosystem: 'EVM',
    id: MOCK_TX_ID,
    index: '0',
    metaData: null,
    module,
    parameters: null,
    requestID: MOCK_REQUEST_ID,
    txHash: null,
    status: null,
    updatedAt: '2024-02-11T16:23:39.568Z',
};

const mockPutTransactionsRouteSuperSwapMockTx = {
    ok: true,
    data: {
        id: MOCK_TX_ID,
        requestID: MOCK_REQUEST_ID,
        index: '0',
        txHash: null,
        ecosystem: 'EVM',
        module,
        status: 'IN PROGRESS',
        parameters,
        account: ETH_ADDRESS_FROM,
        chainId: '137',
        metaData,
        createdAt: '2024-02-09T09:29:03.473Z',
        updatedAt: '2024-02-09T09:29:14.308Z',
    },
    error: '',
};

const mockPutTransactionsWsByUpdateTransactionEventInProgressSuperSwapMockTx = {
    id: MOCK_TX_ID,
    requestID: MOCK_REQUEST_ID,
    index: '0',
    txHash: null,
    ecosystem: 'EVM',
    module,
    status: 'IN PROGRESS',
    parameters,
    account: ETH_ADDRESS_FROM,
    chainId: '137',
    metaData,
    createdAt: '2024-02-09T14:10:59.566Z',
    updatedAt: '2024-02-09T14:11:28.364Z',
};

export {
    mockPostTransactionsRouteSuperSwapMockTx,
    mockPostTransactionsWsByCreateEventSuperSwapMockTx,
    mockPutTransactionsRouteSuperSwapMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSuperSwapMockTx,
};
