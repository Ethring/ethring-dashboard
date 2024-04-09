export enum STATUSES {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REJECTED = 'REJECTED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN PROGRESS',
    SIGNING = 'SIGNING',
}

export enum TRANSACTION_TYPES {
    SEND = 'SEND',
    SIGN = 'SIGN',
    DEX = 'DEX',
    SWAP = 'SWAP',
    BRIDGE = 'BRIDGE',
    APPROVE = 'APPROVE',
}

export const DISALLOW_UPDATE_TYPES = [TRANSACTION_TYPES.APPROVE, TRANSACTION_TYPES.SIGN];

export const DISALLOW_TO_UPDATE_STATUES = [STATUSES.REJECTED, STATUSES.IN_PROGRESS, STATUSES.PENDING];

export const FINISHED_STATUSES = [STATUSES.SUCCESS, STATUSES.FAILED, STATUSES.REJECTED];
