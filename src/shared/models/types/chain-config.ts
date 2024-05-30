import { Ecosystems } from '@/shared/models/enums/ecosystems.enum';

export interface IChainConfig {
    id: string;

    ecosystem: Ecosystems;
    net: string;
    name: string;

    chain_id: number | string;
    chain?: string | number;
    chainName?: string;

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

    asset?: any;

    explorers: string[];
    nodes: string[];

    address_validating?: string;
    derivation_path?: { [key: string]: string };
    main_standards?: string[];
    bech32_prefix?: string;
}
