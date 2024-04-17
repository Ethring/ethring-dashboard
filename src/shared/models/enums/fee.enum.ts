export enum FEE_TYPE {
    BASE = 'BASE',
    RATE = 'RATE',
    PROTOCOL = 'PROTOCOL',
    ESTIMATE = 'ESTIMATE',
}

export type FEE_TYPES = keyof typeof FEE_TYPE;
