export const DATA_PROVIDER_CHAINS = {
    // EVM Ecosystem
    ARBITRUM: 'arbitrum',
    AVALANCHE: 'avalanche',
    BSC: 'bsc',
    ETHEREUM: 'eth',
    FANTOM: 'fantom',
    OPTIMISM: 'optimism',
    DOGECOIN: 'dogecoin',
    POLYGON: 'polygon',

    // Cosmos Ecosystem
    COSMOS: 'cosmoshub',
    CRESCENT: 'crescent',
    JUNO: 'juno',
    INJECTIVE: 'injective',
    KUJIRA: 'kujira',
    MARS: 'mars',
    OSMOSIS: 'osmosis',
    STARGAZE: 'stargaze',
    TERRA2: 'terra2',

    // Other Blockchains
    BTC: 'btc',
    LTC: 'ltc',
    THORCHAIN: 'thorchain',
};

export const DATA_PROVIDER_COSMOS_KEYS = {
    [DATA_PROVIDER_CHAINS.COSMOS]: 'cosmos',
    [DATA_PROVIDER_CHAINS.CRESCENT]: 'crescent',
    [DATA_PROVIDER_CHAINS.JUNO]: 'juno',
    [DATA_PROVIDER_CHAINS.INJECTIVE]: 'injective',
    [DATA_PROVIDER_CHAINS.KUJIRA]: 'kujira',
    [DATA_PROVIDER_CHAINS.MARS]: 'mars',
    [DATA_PROVIDER_CHAINS.OSMOSIS]: 'osmosis',
    [DATA_PROVIDER_CHAINS.STARGAZE]: 'stargaze',
    [DATA_PROVIDER_CHAINS.TERRA2]: 'terra2',
};

export const DATA_PROVIDER_COSMOS_CHAINS = [
    DATA_PROVIDER_CHAINS.COSMOS,
    DATA_PROVIDER_CHAINS.CRESCENT,
    DATA_PROVIDER_CHAINS.JUNO,
    DATA_PROVIDER_CHAINS.INJECTIVE,
    DATA_PROVIDER_CHAINS.KUJIRA,
    DATA_PROVIDER_CHAINS.MARS,
    DATA_PROVIDER_CHAINS.OSMOSIS,
    DATA_PROVIDER_CHAINS.STARGAZE,
    DATA_PROVIDER_CHAINS.TERRA2,
];
