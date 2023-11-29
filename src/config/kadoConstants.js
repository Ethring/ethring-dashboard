export const KADO_URL = 'https://app.kado.money';

const KADO_NETS = {
    POLYGON: 'Polygon',
    OPTIMISM: 'Optimism',
    ETHEREUM: 'Ethereum',
    AVALANCHE: 'Avalanche',
    ARBITRUM: 'Arbitrum',
    COSMOS: 'Cosmos Hub',
    INJECTIVE: 'Injective',
    JUNO: 'Juno',
    OSMOSIS: 'Osmosis',
    TERRA2: 'Terra',
};

const KADO_EVM = [KADO_NETS.POLYGON, KADO_NETS.OPTIMISM, KADO_NETS.ETHEREUM, KADO_NETS.AVALANCHE, KADO_NETS.ARBITRUM];

const KADO_COSMOS = [KADO_NETS.COSMOS, KADO_NETS.INJECTIVE, KADO_NETS.JUNO, KADO_NETS.OSMOSIS, KADO_NETS.TERRA2];

export const KADO_EVM_NETWORKS = [KADO_EVM.join(',')];
export const KADO_COSMOS_NETWORKS = [KADO_COSMOS.join(',')];

export const KADO_DEFAULT_COSMOS = KADO_NETS.COSMOS;

export const KADO_ACTIONS = ['BUY,SELL'];
