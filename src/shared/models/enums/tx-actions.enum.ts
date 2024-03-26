export enum TransactionAction {
    formatTransactionForSign = 'formatTransactionForSign',
    prepareTransaction = 'prepareTransaction',
    prepareDelegateTransaction = 'prepareDelegateTransaction',
}

export type TransactionActionType = keyof typeof TransactionAction;
