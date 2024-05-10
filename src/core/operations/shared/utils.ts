import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';
import { TransactionAction, TransactionActionType } from '@/shared/models/enums/tx-actions.enum';

export const getActionByTxType = (txType: string): TransactionActionType => {
    switch (txType) {
        case TRANSACTION_TYPES.TRANSFER:
            return TransactionAction.prepareTransaction;
        case TRANSACTION_TYPES.STAKE:
            return TransactionAction.prepareDelegateTransaction;

        case TRANSACTION_TYPES.EXECUTE_MULTIPLE:
            return TransactionAction.prepareMultipleExecuteMsgs;

        case TRANSACTION_TYPES.CALL_CONTRACT_METHOD:
            return TransactionAction.callContractMethod;

        // TODO: add more cases
        default:
            return TransactionAction.formatTransactionForSign;
    }
};
