import { TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';
import { TransactionAction, TransactionActionType } from '@/shared/models/enums/tx-actions.enum';

export const getActionByTxType = (txType: string): TransactionActionType => {
    switch (txType) {
        case TRANSACTION_TYPES.TRANSFER:
            return TransactionAction.prepareTransaction;

        case TRANSACTION_TYPES.STAKE:
            return TransactionAction.prepareDelegateTransaction;
        default:
            return TransactionAction.formatTransactionForSign;
    }
};
