export enum ModuleType {
    nft = 'nft',
    send = 'send',
    swap = 'swap',
    bridge = 'bridge',
    superSwap = 'superSwap',
    stake = 'stake',
    shortcut = 'shortcut',
    pendleSilo = 'pendleSilo',
    pendleBeefy = 'pendleBeefy',
    liquidityProvider = 'liquidityProvider',
}

export type ModuleTypes = keyof typeof ModuleType;

export enum DIRECTIONS {
    SOURCE = 'SOURCE',
    DESTINATION = 'DESTINATION',
}

export type DIRECTIONS_TYPE = keyof typeof DIRECTIONS;

export enum TOKEN_SELECT_TYPES {
    FROM = 'FROM',
    TO = 'TO',
}

export type TOKEN_SELECT_TYPES_TYPE = keyof typeof TOKEN_SELECT_TYPES;

export const IS_NEED_DST_NETWORK = [ModuleType.bridge, ModuleType.superSwap];

export const LIKE_SUPER_SWAP = [ModuleType.superSwap, ModuleType.liquidityProvider, ModuleType.pendleBeefy, ModuleType.pendleSilo];

export const IS_NOT_NEED_DST_TOKEN = [ModuleType.send, ModuleType.stake];
