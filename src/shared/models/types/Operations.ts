import { TRANSACTION_TYPES } from '../../../core/operations/models/enums/tx-types.enum';

type TxOperations = keyof typeof TRANSACTION_TYPES;

export type TxOperationFlow = {
    index?: number;
    type: TxOperations;
    make: TxOperations;
    moduleIndex: string;
    title?: string;
    operationId?: string;
};
