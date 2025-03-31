export const TIME_TO_BLOCK = 20000; // 20 seconds in milliseconds

export enum Providers {
    Pulsar = 'Pulsar',
    GoldRush = 'GoldRush',
    LiFi = 'LiFi',
    Enso = 'Enso',
    Alchemy = 'Alchemy',
}

export enum IntegrationBalanceType {
    ALL = 'ALL',
    PENDING = 'PENDING_REWARD',
    FUTURES = 'FUTURES',
    LEVERAGE_POSITION = 'LEVERAGE_POSITION',
    BORROW = 'BORROW',
    BORROW_AND_LENDING = 'BORROW_AND_LENDING',
    DEPOSIT_COLLATERAL = 'DEPOSIT_COLLATERAL',
}

export enum IntegrationDebtType {
    FARM = 'FARM',
    LOAN = 'LOAN',
    SHORT = 'SHORT',
    MARGIN = 'MARGIN',
    MARGIN_LONG = 'MARGIN_LONG',
    MARGIN_SHORT = 'MARGIN_SHORT',
    LEVERAGE_POSITION = 'LEVERAGE_POSITION',
}

export enum Type {
    tokens = 'tokens',
    nfts = 'nfts',
    integrations = 'integrations',
    pools = 'pools',
}

export enum BaseType {
    tokens = 'tokens',
    nfts = 'nfts',
    integrations = 'integrations',
}

// *******************************************************************************************
// * Data Provider SDK Production Chains
// *******************************************************************************************

/**
 * Data Provider SDK Production Chains
 * @description Data Provider SDK Production Chains enum
 */
export enum DP_SDK_PROD_CHAINS_COSMOS {
    AKASH = 'akash',
    AXELAR = 'axelar',
    BANDCHAIN = 'bandchain',
    CELESTIA = 'celestia',
    COSMOSHUB = 'cosmoshub',
    CRYPTOORGCHAIN = 'cryptoorgchain',
    DYDX = 'dydx',
    DYMENSION = 'dymension',
    FETCHHUB = 'fetchhub',
    INJECTIVE = 'injective',
    KAVA = 'kava',
    KUJIRA = 'kujira',
    NEUTRON = 'neutron',
    OSMOSIS = 'osmosis',
    SAGA = 'saga',
    SECRETNETWORK = 'secret',
    SEI = 'sei',
    STARGAZE = 'stargaze',
    SECRET = 'secretnetwork',
    STRIDE = 'stride',
    TERRA2 = 'terra2',

    // AGORIC = 'agoric',
    // ASSETMANTLE = 'assetmantle',
    // BITCANNA = 'bitcanna',
    // BITSONG = 'bitsong',
    // BOSTROM = 'bostrom',
    // CUDOS = 'cudos',
    // CANTO = 'canto',
    // COMDEX = 'comdex',
    // COREUM = 'coreum',
    // EMONEY = 'emoney',
    // FINSCHIA = 'finschia',
    // GRAVITYBRIDGE = 'gravitybridge',
    // IMPACTHUB = 'impacthub',
    // IRISNET = 'irisnet',
    // JUNO = 'juno',
    // KICHAIN = 'kichain',
    // KYVE = 'kyve',
    // LIKECOIN = 'likecoin',
    // LUMNETWORK = 'lumnetwork',
    // MARS = 'mars',
    // OMNIFLIXHUB = 'omniflixhub',
    // ONOMY = 'onomy',
    // PASSAGE = 'passage',
    // PERSISTENCE = 'persistence',
    // PROVENANCE = 'provenance',
    // QUICKSILVER = 'quicksilver',
    // REGEN = 'regen',
    // RIZON = 'rizon',
    // REBUS = 'rebus',
    // SENTINEL = 'sentinel',
    // SHENTU = 'shentu',
    // STAFIHUB = 'stafihub',
    // TERITORI = 'teritori',
    // XPLA = 'xpla',
    // SOURCE = 'source',
    // PLANQ = 'planq',
    // DECENTR = 'decentr',
    // MIGALOO = 'migaloo',
    // EVMOS = 'evmos',
    // MAYA = 'maya',
    // NOBLE = 'noble',
    // NYX = 'nyx',
    // PANACEA = 'panacea',
    // QUASAR = 'quasar',
    // SOMMELIER = 'sommelier',
    // UMEE = 'umee',
}

/**
 * Data Provider SDK Production Chains (EVM)
 * @description Data Provider SDK Production Chains (EVM) enum
 */
export enum DP_SDK_PROD_CHAINS_EVM {
    ARBITRUM = 'arbitrum',
    BASE = 'base',
    BERACHAIN = 'berachain',
    BSC = 'bsc',
    ETHEREUM = 'eth',
    OPTIMISM = 'optimism',

    // LINEA = 'linea',
    // MANTLE = 'mantle',

    // MANTA = 'manta',
    // AVALANCHE = 'avalanche',
    // BLAST = 'blast',
    // GNOSIS = 'gnosis',
    // POLYGON = 'polygon',
    // CELO = 'celo',
    // AURORA = 'aurora',
    // CRONOS = 'cronos',
    // MOONRIVER = 'moonriver',
    // MERLIN = 'merlin',
    // MOONBEAM = 'moonbeam',
    // MODE = 'mode',
    // FANTOM = 'fantom',
    // TRON = 'tron',
    // PULSE = 'pulse',
    // ZORA = 'zora',
    // SCROLL = 'scroll',
    // ZKSYNC = 'zksync',
}

export enum DP_SDK_EVM_CHAIN_IDS {
    ARBITRUM = '0xa4b1',
    BASE = '0x2105',
    BERACHAIN = '0x138d4',
    BSC = '0x38',
    ETHEREUM = '0x1',
    LINEA = '0xe708',
    MANTLE = '0x1388',
}

export const EVM_CHAIN_IDS = Object.values(DP_SDK_EVM_CHAIN_IDS);

/**
 * Data Provider SDK Production Chains (CEX)
 * @description Data Provider SDK Production Chains (CEX) enum
 */
export enum DP_SDK_PROD_CHAINS_CEX {
    BINANCE = 'binance',
    BYBIT = 'bybit',
    COINBASE = 'coinbase',
    CRYPTO = 'crypto',
    GATE = 'gate',
    KRAKEN = 'kraken',
    KUCOIN = 'kucoin',
    OKX = 'okx',
}

/**
 * Data Provider SDK Production Chains (Other)
 * @description Data Provider SDK Production Chains (Other) enum
 */
export enum DP_SDK_PROD_CHAINS_OTHER {
    SOLANA = 'solana',
    SUI = 'sui',
    NEAR = 'near',
    CARDANO = 'cardano',
    THORCHAIN = 'thorchain',
    AVALANCHE_P_CHAIN = 'avalanche_p_chain',
    BNB_BEACON_CHAIN = 'bnb_beacon_chain',
    BTC = 'btc',
    BTC_CASH = 'btc_cash',
    DASH = 'dash',
    DOGECOIN = 'dogecoin',
    ECASH = 'ecash',
    GROESTLCOIN = 'groestlcoin',
    LTC = 'ltc',
    ZCASH = 'zcash',
}

export const DP_CHAINS = {
    ...DP_SDK_PROD_CHAINS_EVM,
    ...DP_SDK_PROD_CHAINS_COSMOS,
};

export const DP_COSMOS = {
    [DP_CHAINS.AKASH]: 'akash',
    [DP_CHAINS.AXELAR]: 'axelar',
    [DP_CHAINS.BANDCHAIN]: 'bandchain',
    [DP_CHAINS.CELESTIA]: 'celestia',
    [DP_CHAINS.COSMOSHUB]: 'cosmoshub',
    [DP_CHAINS.CRYPTOORGCHAIN]: 'cryptoorgchain',
    [DP_CHAINS.DYDX]: 'dydx',
    [DP_CHAINS.DYMENSION]: 'dymension',
    [DP_CHAINS.FETCHHUB]: 'fetchhub',
    [DP_CHAINS.INJECTIVE]: 'injective',
    [DP_CHAINS.KAVA]: 'kava',
    [DP_CHAINS.KUJIRA]: 'kujira',
    [DP_CHAINS.NEUTRON]: 'neutron',
    [DP_CHAINS.OSMOSIS]: 'osmosis',
    [DP_CHAINS.SAGA]: 'saga',
    [DP_CHAINS.SECRET]: 'secretnetwork',
    [DP_CHAINS.SECRETNETWORK]: 'secret',
    [DP_CHAINS.SEI]: 'sei',
    [DP_CHAINS.STARGAZE]: 'stargaze',
    [DP_CHAINS.STRIDE]: 'stride',
    [DP_CHAINS.TERRA2]: 'terra2',

    // [DP_CHAINS.EVMOS]: 'evmos',
    // [DP_CHAINS.MAYA]: 'maya',
    // [DP_CHAINS.NOBLE]: 'noble',
    // [DP_CHAINS.NYX]: 'nyx',
    // [DP_CHAINS.PANACEA]: 'panacea',
    // [DP_CHAINS.QUASAR]: 'quasar',
    // [DP_CHAINS.SOMMELIER]: 'sommelier',
    // [DP_CHAINS.UMEE]: 'umee',
    // [DP_CHAINS.JUNO]: 'juno',
    // [DP_CHAINS.MARS]: 'mars',
    // [DP_CHAINS.ASSETMANTLE]: 'assetmantle',
    // [DP_CHAINS.BITCANNA]: 'bitcanna',
    // [DP_CHAINS.BITSONG]: 'bitsong',
    // [DP_CHAINS.CANTO]: 'canto',
    // [DP_CHAINS.COMDEX]: 'comdex',
    // [DP_CHAINS.COREUM]: 'coreum',
    // [DP_CHAINS.CUDOS]: 'cudos',
    // [DP_CHAINS.EMONEY]: 'emoney',
    // [DP_CHAINS.FINSCHIA]: 'finschia',
    // [DP_CHAINS.GRAVITYBRIDGE]: 'gravitybridge',
    // [DP_CHAINS.IMPACTHUB]: 'impacthub',
    // [DP_CHAINS.IRISNET]: 'irisnet',
    // [DP_CHAINS.KICHAIN]: 'kichain',
    // [DP_CHAINS.KYVE]: 'kyve',
    // [DP_CHAINS.LIKECOIN]: 'likecoin',
    // [DP_CHAINS.LUMNETWORK]: 'lumnetwork',
    // [DP_CHAINS.OMNIFLIXHUB]: 'omniflixhub',
    // [DP_CHAINS.ONOMY]: 'onomy',
    // [DP_CHAINS.PASSAGE]: 'passage',
    // [DP_CHAINS.PERSISTENCE]: 'persistence',
    // [DP_CHAINS.PROVENANCE]: 'provenance',
    // [DP_CHAINS.QUICKSILVER]: 'quicksilver',
    // [DP_CHAINS.REGEN]: 'regen',
    // [DP_CHAINS.RIZON]: 'rizon',
    // [DP_CHAINS.REBUS]: 'rebus',
    // [DP_CHAINS.SENTINEL]: 'sentinel',
    // [DP_CHAINS.SHENTU]: 'shentu',
    // [DP_CHAINS.STAFIHUB]: 'stafihub',
    // [DP_CHAINS.TERITORI]: 'teritori',
    // [DP_CHAINS.XPLA]: 'xpla',
    // [DP_CHAINS.SOURCE]: 'source',
    // [DP_CHAINS.PLANQ]: 'planq',
    // [DP_CHAINS.DECENTR]: 'decentr',
    // [DP_CHAINS.BOSTROM]: 'bostrom',
    // [DP_CHAINS.AGORIC]: 'agoric',
    // [DP_CHAINS.MIGALOO]: 'migaloo',
};

export const POOL_BALANCES_CHAINS = [
    DP_CHAINS.ARBITRUM,
    DP_CHAINS.BASE,
    DP_CHAINS.BSC,
    DP_CHAINS.ETHEREUM,
    // DP_CHAINS.AVALANCHE,
    // DP_CHAINS.FANTOM,
    // DP_CHAINS.OPTIMISM,
    // DP_CHAINS.POLYGON,
];
