export interface EVMTransaction {
    chainId: number; // Chain ID (1 - Ethereum Mainnet, 10 - Optimism, 56 - Binance Smart Chain, 137 - Matic, 250 - Fantom, 42161 - Arbitrum, etc.)

    from: string; // Sender address (hex)
    to: string; // Recipient address (hex)

    gas: string; // Required gas to execute the transaction (get from blockchain); Default is 21000
    gasPrice: string; // Gas price (wei) (1 Gwei = 10^9 wei); Example: 3300000000 in Gwei 3.3

    value: string; // Transaction value (hex)
    data: string; // Transaction data (hex)

    nonce?: number; // Nonce (Transaction count) Optional
}

export interface IBaseTransactionParams {
    fromAddress: string;
    toAddress: string;
    amount: string;
    token: any;
    memo?: string;
}
