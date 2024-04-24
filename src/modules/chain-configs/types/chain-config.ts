export interface ChainConfig {
    ecosystem: string;
    net: string;
    name: string;
    chain_id: number | string;
    logo: string;
    coingecko_id: string;

    native_token: {
        name: string;
        logo: string;
        decimals: number;
        symbol: string;
        price?: number;
        coingecko_id?: string;
    };

    explorers: string[];
    nodes: string[];

    address_validating?: string;
    derivation_path?: { [key: string]: string };
    main_standards?: string[];
    bech32_prefix?: string;
}
