import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';
import { ITransactionResponse, ICreateTransaction } from '@/Transactions/types/Transaction';
import { addTransactionToExistingQueue, createTransactionsQueue, getTransactionsByRequestID, updateTransaction } from '@/Transactions/api';
import { Socket } from 'socket.io-client';
import { SocketEvents } from '@/shared/models/enums/socket-events.enum';
import { handleTransactionStatus } from './shared/utils/tx-statuses';
import { STATUSES } from '@/shared/models/enums/statuses.enum';

export class Transaction {
    id: string | number;
    type: string;
    requestID: string;

    transaction: ITransactionResponse;

    constructor(type: string) {
        this.type = type;
    }

    setId(id: string | number) {
        this.id = id;
    }

    setRequestID(requestID: string) {
        this.requestID = requestID;
    }

    async setTransaction(transaction: ITransactionResponse) {
        this.transaction = transaction;
        await this.updateTransactionById(Number(this.id), { ...transaction, id: Number(transaction.id), index: Number(transaction.index) });
    }

    getTransaction() {
        return this.transaction;
    }

    async updateTransactionById(id: number, transaction: ITransactionResponse): Promise<ITransactionResponse> {
        return await updateTransaction(id, transaction);
    }

    prepare: () => Promise<void>;

    setTxExecuteParameters: () => Promise<void>;

    execute: () => Promise<string>;

    onSuccess?: () => Promise<void>;
    onError?: (error: any) => Promise<void>;
}

class TransactionNode {
    transaction: Transaction;
    next: TransactionNode | null;
    prev: TransactionNode | null;

    constructor(transaction: Transaction) {
        this.transaction = transaction;
        this.next = null;
        this.prev = null;
    }
}

export class TransactionList {
    private requestID: string;
    private firstTxId: string;

    _events: string[] = [SocketEvents.update_transaction, SocketEvents.update_transaction_status];

    head: TransactionNode | null;
    tail: TransactionNode | null;

    socket: Socket;
    store: any;

    constructor(socket: Socket, store: any) {
        this.head = null;
        this.tail = null;

        this.socket = socket;
        this.store = store;
    }

    // ===========================================================================================
    // * Create Transactions Queue
    // ===========================================================================================
    async createTransactionGroup(data: ICreateTransaction): Promise<ITransactionResponse[]> {
        const response = await createTransactionsQueue([data]);

        const [group] = response;

        const { id, requestID } = group;

        this.setRequestID(requestID);

        this.setFirstTxId(id);

        return response;
    }

    // ===========================================================================================
    // * Add Transaction to Existing Queue
    // ===========================================================================================
    async addTransactionToGroup(index: number, data: ICreateTransaction): Promise<ITransactionResponse> {
        const transactions = await getTransactionsByRequestID(this.requestID);

        console.log('transactions', transactions, 'addTransactionToGroup', this.requestID, data, index);
        if (!transactions.length) {
            const response = await this.createTransactionGroup(data);
            return response[0];
        }

        const txToSave = {
            ...data,
            index: Number(index) || transactions.length,
        };

        return await addTransactionToExistingQueue(this.requestID, txToSave);
    }

    setRequestID(requestID: string) {
        this.requestID = requestID;
    }

    setFirstTxId(id: string) {
        this.firstTxId = id;
    }

    getRequestId() {
        return this.requestID;
    }

    getFirstTxId() {
        return this.firstTxId;
    }

    // ===========================================================================================
    // * Wait for Pending Transaction
    // ===========================================================================================

    async waitForPendingTransaction(current: TransactionNode) {
        if (current.transaction.getTransaction().status === STATUSES.PENDING) {
            const txHash = current.transaction.getTransaction().txHash;

            return this.waitForTransaction(txHash);
        }
    }

    // ===========================================================================================
    // * Wait for Transaction
    // ===========================================================================================
    async waitForTransaction(txHash: string): Promise<ITransactionResponse> {
        return new Promise((resolve, reject) => {
            for (const event of this._events) {
                this.socket.on(event, async (data: ITransactionResponse) => {
                    const status = await handleTransactionStatus(data, this.store, event);

                    if (STATUSES.SUCCESS === status && data.txHash === txHash) {
                        return resolve(data);
                    }

                    if ([STATUSES.FAILED, STATUSES.REJECTED].includes(status) && data.txHash === txHash) {
                        return reject(data);
                    }
                });
            }
        });
    }

    // ===========================================================================================
    // * Add Transaction to execute
    // ===========================================================================================
    addTransaction(transaction: Transaction) {
        const newNode = new TransactionNode(transaction);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            newNode.prev = this.tail;
            this.tail!.next = newNode;
            this.tail = newNode;
        }
    }

    // ===========================================================================================
    // * Execute All Transactions in the Queue
    // ===========================================================================================
    async executeTransactions() {
        let current = this.head;

        console.log('current', current, 'executeTransactions', this.requestID);

        while (current) {
            try {
                const hash = await current.transaction.execute();
                await current.transaction.setTransaction({ ...current.transaction.getTransaction(), txHash: hash });

                const waitResponse = await this.waitForTransaction(hash);
                await current.transaction.setTransaction({ ...current.transaction.getTransaction(), status: waitResponse.status });

                if (current.transaction.onSuccess) {
                    await current.transaction.onSuccess();
                }
            } catch (error) {
                if (current.transaction.onError) {
                    current.transaction.onError(error);
                }
            } finally {
                current = current.next;
            }
        }

        for (const event of this._events) {
            this.socket.off(event);
        }
    }
}
