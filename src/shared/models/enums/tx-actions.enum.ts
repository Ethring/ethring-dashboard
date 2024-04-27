export enum TransactionAction {
    formatTransactionForSign = 'formatTransactionForSign',
    prepareTransaction = 'prepareTransaction',
    prepareDelegateTransaction = 'prepareDelegateTransaction',
    prepareMultipleExecuteMsgs = 'prepareMultipleExecuteMsgs',
    callContractMethod = 'callContractMethod',
}

export type TransactionActionType = keyof typeof TransactionAction;
