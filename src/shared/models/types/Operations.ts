import { TRANSACTION_TYPES } from '../enums/statuses.enum';

type TxOperations = keyof typeof TRANSACTION_TYPES;

export type TxOperationFlow = {
    index: number;
    type: TxOperations;

    // Wait for the previous operation to be completed
    waitFor?: TxOperations;
};
