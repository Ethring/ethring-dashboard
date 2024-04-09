export enum TransactionAction {
    formatTransactionForSign = 'formatTransactionForSign',
    prepareTransaction = 'prepareTransaction',
    prepareDelegateTransaction = 'prepareDelegateTransaction',
    prepareMultipleExecuteMsgs = 'prepareMultipleExecuteMsgs',
}

export type TransactionActionType = keyof typeof TransactionAction;
