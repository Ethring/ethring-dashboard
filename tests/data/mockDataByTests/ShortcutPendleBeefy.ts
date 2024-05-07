import { MOCK_OWNER_ADDRESS, MOCK_EVM_TX_HASH, ETH_ADDRESS_FROM } from './ShortcutTransferAndStakeMock';

const MOCK_TX_ID = '12571';
const MOCK_REQUEST_ID = 'a3cb3437-5044-4323-be82-027a08294f63';

export const mockPostTransactionsWsByCreateEventArbitrum = {
    id: MOCK_TX_ID,
    requestID: MOCK_REQUEST_ID,
    index: '0',
    txHash: null,
    ecosystem: 'EVM',
    module: 'pendleBeefy',
    status: null,
    parameters: null,
    account: ETH_ADDRESS_FROM,
    chainId: '42161',
    metaData: null,
    createdAt: '2024-05-07T04:57:56.261Z',
    updatedAt: '2024-05-07T04:57:56.261Z',
};

export const mockPostTransactionsRouteArbitrum = {
    ok: true,
    data: [
        {
            id: MOCK_TX_ID,
            requestID: MOCK_REQUEST_ID,
            index: '0',
            txHash: null,
            ecosystem: 'EVM',
            module: 'pendleBeefy',
            status: null,
            parameters: null,
            account: ETH_ADDRESS_FROM,
            chainId: '42161',
            metaData: null,
            createdAt: '2024-05-07T04:57:56.261Z',
            updatedAt: '2024-05-07T04:57:56.261Z',
        },
    ],
    error: '',
};

export const mockPutTransactionsShortcutPendleBeefy = {
    ok: true,
    data: {
        id: MOCK_TX_ID,
        requestID: MOCK_REQUEST_ID,
        index: '0',
        txHash: MOCK_EVM_TX_HASH,
        ecosystem: 'EVM',
        module: 'pendleBeefy',
        status: 'IN PROGRESS',
        parameters: {
            to: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
            gas: 289268,
            data: '0xa6886da90000000000000000000000000000000000000000000000000000000000000020000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000002416092f143378750bb29b79ed961ab195cceea5000000000000000000000000e592427a0aece92de3edee1f18e0157c0586156400000000000000000000000000000000000000000000000000016bcc41e9000000000000000000000000000000000000000000000000000000016ed0705bf50a000000000000000000000000000000000000000000000000000170a8520ca915010000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000663a093600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c1887b211c3dd04405e94388a3944eb5c29e47f200000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000022053678048aae34722bf21de3a2d0e751300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b82af49447d8a07e3bd95bd0d56f35241523fbab10000642416092f143378750bb29b79ed961ab195cceea50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            from: ETH_ADDRESS_FROM,
            value: '0x016bcc41e90000',
            chainId: 42161,
            gasPrice: 112000000,
        },
        account: ETH_ADDRESS_FROM,
        chainId: '42161',
        metaData: {
            type: 'DEX',
            action: 'formatTransactionForSign',
            params: {
                net: 'arbitrum',
                toNet: 'arbitrum',
                amount: '0.0004',
                fromNet: 'arbitrum',
                toToken: '0x2416092f143378750bb29b79ed961ab195cceea5',
                fromToken: null,
                serviceId: 'paraswap',
                startTime: 1715057874354,
                outputAmount: '0.000405343210088725',
                ownerAddresses: MOCK_OWNER_ADDRESS,
            },
            tokens: {
                to: {
                    id: 'arbitrum:tokens__0x2416092f143378750bb29b79ed961ab195cceea5:EZETH',
                    logo: 'https://assets.coingecko.com/coins/images/34753/large/eth_renzo_logo_%281%29.png?1705956747',
                    name: 'Renzo Restaked ETH',
                    chain: 'arbitrum',
                    amount: null,
                    symbol: 'EZETH',
                    address: '0x2416092f143378750bb29b79ed961ab195cceea5',
                    balance: 0,
                    decimals: 18,
                    standard: 'erc20',
                    ecosystem: 'EVM',
                    balanceUsd: 0,
                },
                from: {
                    id: 'arbitrum:tokens__native:ETH',
                    net: 'arbitrum',
                    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=003',
                    name: 'Ether Native Token',
                    chain: 'arbitrum',
                    price: 3063.54,
                    amount: null,
                    symbol: 'ETH',
                    address: null,
                    balance: '0.00124933469806557',
                    decimals: 18,
                    verified: true,
                    chainLogo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
                    balanceUsd: '3.820654562',
                    priceChange: '-85.44818398869256',
                    coingecko_id: 'ethereum',
                },
            },
            notificationTitle: 'SWAP 0.0004 ETH',
            notificationDescription: 'For 0.000405 EZETH',
        },
        createdAt: '2024-05-07T04:57:56.261Z',
        updatedAt: '2024-05-07T04:57:59.309Z',
    },
    error: '',
};

export const mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutPendleBeefyTx = {
    id: MOCK_TX_ID,
    requestID: MOCK_REQUEST_ID,
    index: '0',
    txHash: MOCK_EVM_TX_HASH,
    ecosystem: 'EVM',
    module: 'pendleBeefy',
    status: 'IN PROGRESS',
    parameters: {
        to: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
        gas: 289268,
        data: '0xa6886da90000000000000000000000000000000000000000000000000000000000000020000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000002416092f143378750bb29b79ed961ab195cceea5000000000000000000000000e592427a0aece92de3edee1f18e0157c0586156400000000000000000000000000000000000000000000000000016bcc41e9000000000000000000000000000000000000000000000000000000016ed0705bf50a000000000000000000000000000000000000000000000000000170a8520ca915010000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000663a093600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c1887b211c3dd04405e94388a3944eb5c29e47f200000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000022053678048aae34722bf21de3a2d0e751300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b82af49447d8a07e3bd95bd0d56f35241523fbab10000642416092f143378750bb29b79ed961ab195cceea50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        from: ETH_ADDRESS_FROM,
        value: '0x016bcc41e90000',
        chainId: 42161,
        gasPrice: 112000000,
    },
    account: ETH_ADDRESS_FROM,
    chainId: '42161',
    metaData: {
        type: 'DEX',
        action: 'formatTransactionForSign',
        params: {
            net: 'arbitrum',
            toNet: 'arbitrum',
            amount: '0.0004',
            fromNet: 'arbitrum',
            toToken: '0x2416092f143378750bb29b79ed961ab195cceea5',
            fromToken: null,
            serviceId: 'paraswap',
            startTime: 1715057874354,
            outputAmount: '0.000405343210088725',
            ownerAddresses: MOCK_OWNER_ADDRESS,
        },
        tokens: {
            to: {
                id: 'arbitrum:tokens__0x2416092f143378750bb29b79ed961ab195cceea5:EZETH',
                logo: 'https://assets.coingecko.com/coins/images/34753/large/eth_renzo_logo_%281%29.png?1705956747',
                name: 'Renzo Restaked ETH',
                chain: 'arbitrum',
                amount: null,
                symbol: 'EZETH',
                address: '0x2416092f143378750bb29b79ed961ab195cceea5',
                balance: 0,
                decimals: 18,
                standard: 'erc20',
                ecosystem: 'EVM',
                balanceUsd: 0,
            },
            from: {
                id: 'arbitrum:tokens__native:ETH',
                net: 'arbitrum',
                logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=003',
                name: 'Ether Native Token',
                chain: 'arbitrum',
                price: 3063.54,
                amount: null,
                symbol: 'ETH',
                address: null,
                balance: '0.00124933469806557',
                decimals: 18,
                verified: true,
                chainLogo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
                balanceUsd: '3.820654562',
                priceChange: '-85.44818398869256',
                coingecko_id: 'ethereum',
            },
        },
        notificationTitle: 'SWAP 0.0004 ETH',
        notificationDescription: 'For 0.000405 EZETH',
    },
    createdAt: '2024-05-07T04:57:56.261Z',
    updatedAt: '2024-05-07T04:57:59.309Z',
};
