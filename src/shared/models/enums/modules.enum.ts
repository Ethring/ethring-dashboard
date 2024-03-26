export enum ModuleType {
    send = 'send',
    swap = 'swap',
    bridge = 'bridge',
    superSwap = 'superSwap',
    stake = 'stake',
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
