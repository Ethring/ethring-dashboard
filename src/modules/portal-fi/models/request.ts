export interface IGetAllowanceRequest {
    net: string;
    ownerAddress: string;
    tokenAddress: string;
    amount?: string;
    gasPrice?: number;
}

export interface IGetAllowanceResponse {
    data: number;
}

export interface IGetQuoteAddLiquidityRequest {
    from: string;
    to: string;
    poolID: string;
    tokenAddress: string;
    amount: number;
    slippageTolerance?: number;
    ownerAddress?: string;
    gasPrice?: number;
}

export interface IGetQuoteAddLiquidityResponse {
    outputAmount: string;
    minOutputAmount: string;
    outputToken: string;
    outputTokenDecimals: number;
    context: {
        slippageTolerancePercentage: number;
        inputAmount: string;
        inputAmountUsd: number;
        inputToken: string;
        outputToken: string;
        outputAmount: string;
        outputAmountUsd: number;
        minOutputAmountUsd: number;
    };
}

export interface IGetQuoteRemoveLiquidityResponse {
    poolID: string;
    poolTokens: [];
    lpTokenAmount: string;
    lpTokenAmountUsd?: number;
    sender?: string;
}

export interface IGetUserBalancePoolListRequest {
    net: string;
    ownerAddress: string;
}

export interface IGetPoolListRequest {
    net: string;
    protocol: string;
    tokenAddress?: string;
    search?: string;
    minTVL?: string;
    maxTVL?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
}

export interface IGetUsersPoolListResponse {
    name: string;
    decimals: number;
    symbol: string;
    price: number;
    address: string;
    addresses: any;
    platform: string;
    network: string;
    images: [];
    tokens: [];
    liquidity: number;
    metrics: {
        apy: string;
        volumeUsd1d: string;
        volumeUsd7d: string;
    };
    metadata: any;
    totalSupply: string;
    reserves: [];
    balanceUSD: number;
    balance: number;
}
