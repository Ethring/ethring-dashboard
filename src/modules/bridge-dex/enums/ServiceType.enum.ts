export enum ServiceType {
    'bridgedex' = 'bridgedex',
    'superswap' = 'superswap',
    'dex' = 'dex',
}

export type ServiceTypes = keyof typeof ServiceType;

export enum ModuleType {
    send = 'send',
    swap = 'swap',
    bridge = 'bridge',
    superSwap = 'superSwap',
    stake = 'stake',
}

export type ModuleTypes = keyof typeof ModuleType;

export const ServiceByModule = {
    [ModuleType.swap]: ServiceType.dex,
    [ModuleType.bridge]: ServiceType.bridgedex,
    [ModuleType.superSwap]: ServiceType.superswap,
};

export const ModulesByService = {
    [ServiceType.dex]: [ModuleType.swap],
    [ServiceType.bridgedex]: [ModuleType.bridge],
    [ServiceType.superswap]: [ModuleType.superSwap],
};
