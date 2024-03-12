export interface NetworkData {
    id: string;
    ecosystem: string;
    chain: string;
    chain_id: number | string;
    logo?: string;
    net: string;
    name: string;
    walletModule: string;
    walletName: string;

    native_token: {
        coingecko_id: string;
        decimals: number;
        logo: string;
        name: string;
        symbol: string;
    };

    main_standards?: string[];

    address_validating?: string;

    coingecko_id?: string;
}

export interface TokenData {
    id: string;
    name: string;
    symbol: string;

    address?: string;
    decimals: number;

    logo?: string;

    price?: string;
    priceChange?: string;

    balanceUsd: string;
    balance: string;

    chain: string;
    chainLogo: string;
}
