export enum Providers {
    Pulsar = 'Pulsar',
    GoldRush = 'GoldRush',
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
    ASSETMANTLE = 'assetmantle',
    AXELAR = 'axelar',
    BANDCHAIN = 'bandchain',
    BITCANNA = 'bitcanna',
    BITSONG = 'bitsong',
    CANTO = 'canto',
    COMDEX = 'comdex',
    COREUM = 'coreum',
    COSMOSHUB = 'cosmoshub',
    CRYPTOORGCHAIN = 'cryptoorgchain',
    CUDOS = 'cudos',
    DESMOS = 'desmos',
    DYDX = 'dydx',
    DYMENSION = 'dymension',
    EMONEY = 'emoney',
    EVMOS = 'evmos',
    FETCHHUB = 'fetchhub',
    FINSCHIA = 'finschia',
    GRAVITYBRIDGE = 'gravitybridge',
    IMPACTHUB = 'impacthub',
    INJECTIVE = 'injective',
    IRISNET = 'irisnet',
    JUNO = 'juno',
    KAVA = 'kava',
    KICHAIN = 'kichain',
    KUJIRA = 'kujira',
    KYVE = 'kyve',
    LIKECOIN = 'likecoin',
    LUMNETWORK = 'lumnetwork',
    MARS = 'mars',
    NEUTRON = 'neutron',
    NOBLE = 'noble',
    NYX = 'nyx',
    OMNIFLIXHUB = 'omniflixhub',
    ONOMY = 'onomy',
    OSMOSIS = 'osmosis',
    PANACEA = 'panacea',
    PASSAGE = 'passage',
    PERSISTENCE = 'persistence',
    PROVENANCE = 'provenance',
    QUASAR = 'quasar',
    QUICKSILVER = 'quicksilver',
    REGEN = 'regen',
    RIZON = 'rizon',
    REBUS = 'rebus',
    SAGA = 'saga',
    SECRETNETWORK = 'secret',
    SECRET = 'secretnetwork',
    SEI = 'sei',
    SENTINEL = 'sentinel',
    SHENTU = 'shentu',
    SOMMELIER = 'sommelier',
    STAFIHUB = 'stafihub',
    STARGAZE = 'stargaze',
    STRIDE = 'stride',
    TERITORI = 'teritori',
    TERRA2 = 'terra2',
    UMEE = 'umee',
    XPLA = 'xpla',
    SOURCE = 'source',
    PLANQ = 'planq',
    MAYA = 'maya',
    DECENTR = 'decentr',
    CELESTIA = 'celestia',
    BOSTROM = 'bostrom',
    AGORIC = 'agoric',
    MIGALOO = 'migaloo',
}

/**
 * Data Provider SDK Production Chains (EVM)
 * @description Data Provider SDK Production Chains (EVM) enum
 */
export enum DP_SDK_PROD_CHAINS_EVM {
    ARBITRUM = 'arbitrum',
    OP_BNB = 'op_bnb',
    OPTIMISM = 'optimism',
    ZKSYNC = 'zksync',
    EVMOS_EVM = 'evmos_evm',
    BLAST = 'blast',
    LINEA = 'linea',
    ETHEREUM = 'eth',
    POLYGON = 'polygon',
    MODE = 'mode',
    POLYGON_ZK = 'polygon_zk',
    GNOSIS = 'gnosis',
    MOONRIVER = 'moonriver',
    CRONOS = 'cronos',
    MANTA = 'manta',
    BASE = 'base',
    CELO = 'celo',
    AVALANCHE = 'avalanche',
    AURORA = 'aurora',
    MANTLE = 'mantle',
    MERLIN = 'merlin',
    BSC = 'bsc',
    KAVA_EVM = 'kava_evm',
    FANTOM = 'fantom',
    CANTO_EVM = 'canto_evm',
    TRON = 'tron',
    PULSE = 'pulse',
    MOONBEAM = 'moonbeam',
}

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
    [DP_CHAINS.COSMOSHUB]: 'cosmoshub',
    [DP_CHAINS.JUNO]: 'juno',
    [DP_CHAINS.INJECTIVE]: 'injective',
    [DP_CHAINS.KUJIRA]: 'kujira',
    [DP_CHAINS.MARS]: 'mars',
    [DP_CHAINS.OSMOSIS]: 'osmosis',
    [DP_CHAINS.STARGAZE]: 'stargaze',
    [DP_CHAINS.TERRA2]: 'terra2',
    [DP_CHAINS.AKASH]: 'akash',
    [DP_CHAINS.ASSETMANTLE]: 'assetmantle',
    [DP_CHAINS.AXELAR]: 'axelar',
    [DP_CHAINS.BANDCHAIN]: 'bandchain',
    [DP_CHAINS.BITCANNA]: 'bitcanna',
    [DP_CHAINS.BITSONG]: 'bitsong',
    [DP_CHAINS.CANTO]: 'canto',
    [DP_CHAINS.COMDEX]: 'comdex',
    [DP_CHAINS.COREUM]: 'coreum',
    [DP_CHAINS.CRYPTOORGCHAIN]: 'cryptoorgchain',
    [DP_CHAINS.CUDOS]: 'cudos',
    [DP_CHAINS.DESMOS]: 'desmos',
    [DP_CHAINS.DYDX]: 'dydx',
    [DP_CHAINS.DYMENSION]: 'dymension',
    [DP_CHAINS.EMONEY]: 'emoney',
    [DP_CHAINS.EVMOS]: 'evmos',
    [DP_CHAINS.FETCHHUB]: 'fetchhub',
    [DP_CHAINS.FINSCHIA]: 'finschia',
    [DP_CHAINS.GRAVITYBRIDGE]: 'gravitybridge',
    [DP_CHAINS.IMPACTHUB]: 'impacthub',
    [DP_CHAINS.IRISNET]: 'irisnet',
    [DP_CHAINS.KAVA]: 'kava',
    [DP_CHAINS.KICHAIN]: 'kichain',
    [DP_CHAINS.KYVE]: 'kyve',
    [DP_CHAINS.LIKECOIN]: 'likecoin',
    [DP_CHAINS.LUMNETWORK]: 'lumnetwork',
    [DP_CHAINS.NEUTRON]: 'neutron',
    [DP_CHAINS.NOBLE]: 'noble',
    [DP_CHAINS.NYX]: 'nyx',
    [DP_CHAINS.OMNIFLIXHUB]: 'omniflixhub',
    [DP_CHAINS.ONOMY]: 'onomy',
    [DP_CHAINS.PANACEA]: 'panacea',
    [DP_CHAINS.PASSAGE]: 'passage',
    [DP_CHAINS.PERSISTENCE]: 'persistence',
    [DP_CHAINS.PROVENANCE]: 'provenance',
    [DP_CHAINS.QUASAR]: 'quasar',
    [DP_CHAINS.QUICKSILVER]: 'quicksilver',
    [DP_CHAINS.REGEN]: 'regen',
    [DP_CHAINS.RIZON]: 'rizon',
    [DP_CHAINS.REBUS]: 'rebus',
    [DP_CHAINS.SAGA]: 'saga',
    [DP_CHAINS.SECRETNETWORK]: 'secret',
    [DP_CHAINS.SECRET]: 'secretnetwork',
    [DP_CHAINS.SEI]: 'sei',
    [DP_CHAINS.SENTINEL]: 'sentinel',
    [DP_CHAINS.SHENTU]: 'shentu',
    [DP_CHAINS.SOMMELIER]: 'sommelier',
    [DP_CHAINS.STAFIHUB]: 'stafihub',
    [DP_CHAINS.STRIDE]: 'stride',
    [DP_CHAINS.TERITORI]: 'teritori',
    [DP_CHAINS.UMEE]: 'umee',
    [DP_CHAINS.XPLA]: 'xpla',
    [DP_CHAINS.SOURCE]: 'source',
    [DP_CHAINS.PLANQ]: 'planq',
    [DP_CHAINS.MAYA]: 'maya',
    [DP_CHAINS.DECENTR]: 'decentr',
    [DP_CHAINS.CELESTIA]: 'celestia',
    [DP_CHAINS.BOSTROM]: 'bostrom',
    [DP_CHAINS.AGORIC]: 'agoric',
    [DP_CHAINS.MIGALOO]: 'migaloo',
};

export const POOL_BALANCES_CHAINS = [
    DP_CHAINS.ARBITRUM,
    DP_CHAINS.AVALANCHE,
    DP_CHAINS.BSC,
    DP_CHAINS.OPTIMISM,
    DP_CHAINS.FANTOM,
    DP_CHAINS.POLYGON,
    DP_CHAINS.BASE,
];
