import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

export enum STATUSES {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REJECTED = 'REJECTED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN PROGRESS',
    SIGNING = 'SIGNING',
    ESTIMATING = 'ESTIMATING',
    SKIPPED = 'SKIPPED',
}

export type STATUS_TYPE = keyof typeof STATUSES;

export enum SHORTCUT_STATUSES {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    REJECTED = 'REJECTED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN PROGRESS',
}

export const DISALLOW_UPDATE_TYPES = [TRANSACTION_TYPES.APPROVE, TRANSACTION_TYPES.SIGN];

export const DISALLOW_TO_UPDATE_STATUES = [STATUSES.REJECTED, STATUSES.IN_PROGRESS, STATUSES.PENDING];

export const FINISHED_STATUSES = [STATUSES.SUCCESS, STATUSES.FAILED, STATUSES.REJECTED];
