import { ITransactionResponse, ICreateTransaction } from '@/core/transaction-manager/types/Transaction';
import {
    addTransactionToExistingQueue,
    createTransactionsQueue,
    getTransactionsByRequestID,
    updateTransaction,
} from '@/core/transaction-manager/api';
import { Socket } from 'socket.io-client';
import { SocketEvents } from '@/shared/models/enums/socket-events.enum';
import { handleTransactionStatus } from './shared/utils/tx-statuses';
import { STATUSES } from '@/shared/models/enums/statuses.enum';
import { delay } from '@/shared/utils/helpers';

import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

interface ITransaction {
    id: string | number;
    type: string;
    requestID: string;
    chainId: string;
    transaction: ITransactionResponse;
    ecosystem: string;
    waitTime: number; // in seconds
    setTransaction: (transaction: ITransactionResponse) => void;
    getTxId: () => string | number;
    getTransaction: () => ITransactionResponse;
    getEcosystem: () => Ecosystems;
    getChainId: () => string;
    updateTransactionById: (id: number, transaction: ITransactionResponse) => Promise<ITransactionResponse>;
    prepare: () => Promise<void>;
    setTxExecuteParameters: () => Promise<void>;
    execute: () => Promise<string | null>;
    onSuccess?: () => Promise<void>;
    onSuccessSignTransaction?: () => Promise<void>;
    onError?: (error: any) => Promise<void>;
    onCancel?: () => Promise<void>;

    getWaitTime: () => number;
    setWaitTime: (waitTime: number) => void;
}

export class Transaction implements ITransaction {
    id: string | number = '';
    type: string = '';
    index: number = 0;
    requestID: string = '';
    chainId: string = '';
    waitTime: number = 0;

    transaction: ITransactionResponse = {} as ITransactionResponse;

    ecosystem: string = '';

    constructor(type: string) {
        this.type = type;
    }

    setId(id: string | number) {
        this.id = id;
    }

    setIndex(index: number) {
        this.index = index;
    }

    setChainId(chainId: string) {
        this.chainId = chainId;
    }

    setRequestID(requestID: string) {
        this.requestID = requestID;
    }

    setTransactionEcosystem(ecosystem: string) {
        this.ecosystem = ecosystem;
    }

    setTransaction(transaction: ITransactionResponse) {
        this.transaction = transaction;
    }

    getTxId() {
        return this.id;
    }

    getTransaction() {
        return this.transaction;
    }

    getEcosystem(): Ecosystems {
        return this.ecosystem as Ecosystems;
    }

    getChainId() {
        return this.chainId?.toString();
    }

    async updateTransactionById(id: number, transaction: ITransactionResponse): Promise<ITransactionResponse> {
        this.setTransaction(transaction);
        return await updateTransaction(id, { ...transaction, id: Number(transaction.id), index: Number(transaction.index) });
    }

    prepare!: () => Promise<void>;

    setTxExecuteParameters!: () => Promise<void>;

    execute!: () => Promise<string | null>;

    onSuccess?: () => Promise<void>;
    onSuccessSignTransaction?: () => Promise<void>;
    onError?: (error: any) => Promise<void>;
    onCancel?: () => Promise<void>;

    getWaitTime() {
        return this.waitTime || 3.5;
    }

    setWaitTime(waitTime: number) {
        this.waitTime = waitTime;
    }
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
    private requestID: string = '';
    private firstTxId: string = '';

    _events: string[] = [SocketEvents.update_transaction, SocketEvents.update_transaction_status];

    head: TransactionNode | null;
    tail: TransactionNode | null;

    socket: Socket;
    store: any;

    currentIndex: number;
    checkStatus: boolean;

    constructor(socket: Socket, store: any) {
        this.head = null;
        this.tail = null;

        this.socket = socket;
        this.store = store;

        this.currentIndex = 0;
        this.checkStatus = true;
    }

    // ===========================================================================================
    // * Create Transactions Queue
    // ===========================================================================================
    async createTransactionGroup(data: ICreateTransaction): Promise<ITransactionResponse[]> {
        const response = (await createTransactionsQueue([data])) || [];

        if (!response || !response?.length) throw new Error('Failed to create transaction group');

        const [group] = response || [];

        const { id, requestID } = group || {};

        this.setRequestID(requestID);

        this.setFirstTxId(id);

        return response;
    }

    // ===========================================================================================
    // * Add Transaction to Existing Queue
    // ===========================================================================================
    async addTransactionToGroup(index: number, data: ICreateTransaction): Promise<ITransactionResponse> {
        const transactions = (await getTransactionsByRequestID(this.requestID)) || [];

        if (index === 0) return transactions[0];

        if (!transactions.length) {
            const response = await this.createTransactionGroup(data);
            return response[0];
        }

        const txToSave = {
            ...data,
            index,
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
    // * Timer worker for transaction status checker
    // ===========================================================================================

    setupWorkerForTxStatus(resolve: (data: ITransactionResponse) => void, reject: () => void) {
        const worker = this.store.getters['txManager/txStatusTimerWorker'];

        if (!worker) {
            console.warn('Tx status check timer worker not found');
            return;
        }

        worker.postMessage('start_timer');

        worker.onmessage = async (event: MessageEvent) => {
            if (!event.data) return;

            const { timerID } = event.data || {};

            if (timerID) this.store.dispatch('txManager/setTxStatusTimerID', timerID);
            if (event.data === 'timer_expired') await this.checkTxStatus(resolve, reject);
        };
    }

    // ===========================================================================================
    // * Check transaction status by GET request
    // ===========================================================================================

    async checkTxStatus(resolve: (data: ITransactionResponse) => void, reject: () => void) {
        try {
            if (!this.checkStatus) return;

            const transactions = (await getTransactionsByRequestID(this.requestID)) || [];

            if (transactions[this.currentIndex].status) {
                const status = await handleTransactionStatus(
                    transactions[this.currentIndex],
                    this.store,
                    SocketEvents.update_transaction_status,
                );
                if (status === STATUSES.IN_PROGRESS)
                    setTimeout(() => {
                        this.checkTxStatus(resolve, reject);
                    }, 15000);
                else resolve(transactions[this.currentIndex]);
            } else {
                setTimeout(() => {
                    this.checkTxStatus(resolve, reject);
                }, 15000);
            }
        } catch {
            reject();
        }
    }

    // ===========================================================================================
    // * Wait for Pending Transaction
    // ===========================================================================================

    async waitForPendingTransaction(current: TransactionNode) {
        if (!current) return;
        if (!current.transaction.getTransaction()) return;

        const tx = current.transaction.getTransaction() as ITransactionResponse;

        if (tx.status === STATUSES.PENDING) {
            const txHash = tx.txHash;
            return this.waitForTransaction(txHash as string);
        }
    }

    // ===========================================================================================
    // * Wait for Transaction
    // ===========================================================================================
    async waitForTransaction(txHash: string): Promise<ITransactionResponse> {
        return new Promise((resolve, reject) => {
            this.setupWorkerForTxStatus(resolve, reject);

            for (const event of this._events)
                this.socket.on(event, async (data: ITransactionResponse) => {
                    const status = await handleTransactionStatus(data, this.store, event);

                    if (STATUSES.SUCCESS === status && data.txHash === txHash) return resolve(data);

                    if ([STATUSES.FAILED, STATUSES.REJECTED].includes(status) && data.txHash === txHash) return reject(data);
                });
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
        if (!current) return;

        while (current) {
            try {
                this.currentIndex = current.transaction.index;
                this.checkStatus = true;
                // ? Prepare the transaction
                await current.transaction.prepare();
                // ? Set the transaction execute parameters
                await current.transaction.setTxExecuteParameters();
            } catch (error) {
                this.store.dispatch('txManager/setTxTimerID', null);

                if (current.transaction.onError) current.transaction.onError(error);

                throw error;
            }

            try {
                const hash = await current.transaction.execute();
                if (!hash) return;

                if (current.transaction.onSuccessSignTransaction) {
                    await this.waitForTransaction(hash);
                    this.checkStatus = false;
                    await current.transaction.onSuccessSignTransaction();
                    current.transaction.setTransaction({ ...current.transaction.getTransaction(), txHash: hash });
                }

                const WAIT_TIME_SEC = current.transaction.getWaitTime();
                const WAIT_TIME_MSEC = WAIT_TIME_SEC * 1000;

                console.log(`WAITING ${WAIT_TIME_SEC} SECONDS BEFORE NEXT TRANSACTION`);

                await delay(WAIT_TIME_MSEC);

                if (current.transaction.onSuccess) await current.transaction.onSuccess();
            } catch (error) {
                if (current.transaction.onError) current.transaction.onError(error);

                throw error;
            } finally {
                current = current.next;
                this.store.dispatch('txManager/setTxTimerID', null);
                this.store.dispatch('txManager/setTxStatusTimerID', null);
            }
        }

        for (const event of this._events) this.socket.off(event);
    }

    getTransactions(): Transaction[] {
        let current = this.head;
        const transactions = [];

        while (current) {
            transactions.push(current.transaction);
            current = current.next;
        }

        return transactions;
    }
}
