import { Type } from './enums';

type BaseToken = {
    name: string | null;
    symbol: string | null;
    address: string | null;

    decimals: number;

    logo: string | null;

    price: number | null;
    priceChange: number | null;

    balanceUsd: number | string;
    balance: number | string;

    balanceType?: string;
    leverageRate?: number;
};

type Validator = {
    address: string;
    commissionPercentage: string;
    name: string;
    status: string;
};

export type IntegrationResponse = {
    integrationId: string;

    type: string;
    stakingType: string;

    name: string;

    chain: string;
    logo: string;

    platform: string;
    url: string;

    balances: BaseToken[];

    validator?: Validator;

    address?: string;
};

export type IntegrationBalance = IntegrationResponse & {
    id: string;
    chain: string;
    chainLogo: string;
};

export type AssetBalance = BaseToken & {
    id: string;
    chain: string;
    chainLogo: string;
    base: string | null;
};

// ====================================================

type Marketplace = {
    url: string;
    name: string;
};

type NftCollection = {
    address: string;
    name: string;
    avatar: string;
    description: string;
    floorPrice: string;
    marketCap: string;
    volume: string | null;
    numberOfAssets: number;
    marketplaces: Marketplace[];
};

type NftResponse = {
    chain: string;
    name: string;
    tokenId: string;
    description: string;
    avatar: string;
    url: string;
    price: string;
    ownerAddress: string;
    token: BaseToken;
    collection: NftCollection;
};

export type NftBalance = NftResponse & {
    id: string;
    chain: string;
    chainLogo: string;
};

type ChainAddress = {
    logo: string;
    address: string;
    nativeTokenLogo?: string
};

export type ChainAddresses = {
    [key: string]: ChainAddress;
};

export type DataProviderResponse = {
    ok: boolean;
    data: BalanceResponse;
    error: any;
};

export type BalanceResponse = {
    tokens: BaseToken[];
    integrations: IntegrationResponse[];
    nfts: NftResponse[];
};

export type RequestOptions = {
    isUpdate?: boolean;
};

export type RecordOptions = RequestOptions & {
    logo?: string;
    chain?: string;
    nativeTokenLogo?: string
    store?: any;
};

export type RecordList = BaseToken[] | IntegrationResponse[] | NftResponse[];

export type BalanceType = Type.tokens | Type.nfts | Type.integrations;

export type ProviderRequestOptions = {
    fetchTokens?: boolean;
    fetchIntegrations?: boolean;
    fetchNfts?: boolean;
};
