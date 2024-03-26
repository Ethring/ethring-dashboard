import { TRANSACTION_TYPES } from '../enums/statuses.enum';

type TxOperations = keyof typeof TRANSACTION_TYPES;

export type TxOperationFlow = {
    index?: number;
    moduleIndex?: string;
    type: TxOperations;
    make: TxOperations;
};
