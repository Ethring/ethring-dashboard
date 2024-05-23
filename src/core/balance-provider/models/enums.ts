export enum IntegrationBalanceType {
    ALL = 'ALL',
    PENDING = 'PENDING_REWARD',
    FUTURES = 'FUTURES',
    LEVERAGE_POSITION = 'LEVERAGE_POSITION',
    BORROW = 'BORROW',
    BORROW_AND_LENDING = 'BORROW_AND_LENDING',
    DEPOSIT_COLLATERAL = 'DEPOSIT_COLLATERAL',
}

export enum Type {
    tokens = 'tokens',
    nfts = 'nfts',
    integrations = 'integrations',
}

export enum DP_CHAINS {
    // EVM Ecosystem
    ARBITRUM = 'arbitrum',
    AVALANCHE = 'avalanche',
    BSC = 'bsc',
    ETHEREUM = 'eth',
    FANTOM = 'fantom',
    OPTIMISM = 'optimism',
    DOGECOIN = 'dogecoin',
    POLYGON = 'polygon',
    ZKSYNC = 'zksync',

    // Cosmos Ecosystem
    COSMOS = 'cosmoshub',
    COSMOSHUB = 'cosmos',
    CRESCENT = 'crescent',
    JUNO = 'juno',
    INJECTIVE = 'injective',
    KUJIRA = 'kujira',
    MARS = 'mars',
    OSMOSIS = 'osmosis',
    STARGAZE = 'stargaze',
    TERRA2 = 'terra2',

    // Other Blockchains
    // BTC= 'btc',
    // LTC= 'ltc',
    // THORCHAIN= 'thorchain',
}

export const DP_COSMOS = {
    [DP_CHAINS.COSMOS]: 'cosmos',
    [DP_CHAINS.COSMOSHUB]: 'cosmoshub',

    [DP_CHAINS.CRESCENT]: 'crescent',
    [DP_CHAINS.JUNO]: 'juno',
    [DP_CHAINS.INJECTIVE]: 'injective',
    [DP_CHAINS.KUJIRA]: 'kujira',
    [DP_CHAINS.MARS]: 'mars',
    [DP_CHAINS.OSMOSIS]: 'osmosis',
    [DP_CHAINS.STARGAZE]: 'stargaze',
    [DP_CHAINS.TERRA2]: 'terra2',
};

export const DATA_PROVIDER_COSMOS_CHAINS = [
    DP_CHAINS.COSMOS,
    DP_CHAINS.CRESCENT,
    DP_CHAINS.JUNO,
    DP_CHAINS.INJECTIVE,
    DP_CHAINS.KUJIRA,
    DP_CHAINS.MARS,
    DP_CHAINS.OSMOSIS,
    DP_CHAINS.STARGAZE,
    DP_CHAINS.TERRA2,
];
