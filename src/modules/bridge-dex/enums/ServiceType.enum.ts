import { ModuleType } from '@/shared/models/enums/modules.enum';

export enum ServiceType {
    'bridgedex' = 'bridgedex',
    'superswap' = 'superswap',
    'dex' = 'dex',
}

export type ServiceTypes = keyof typeof ServiceType;

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
