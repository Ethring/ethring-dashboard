// WebSocketMock.ts
import { SocketEvents } from '../../../src/shared/models/enums/socket-events.enum';
import { handleTransactionStatus } from '../../../src/core/transaction-manager/shared/utils/tx-statuses';

export default class WebSocketMock {
    listeners: { [event: string]: Function[] } = {};
    addresses: any = {};
    store: Storage;
    socket: null;

    constructor(store: Storage) {
        this.store = store;
        // Simulate connection
        setTimeout(() => this.triggerEvent('connect'), 100);
    }

    on(event: string, callback: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];

        this.listeners[event].push(callback);
    }

    async emit(event: string, data?: any) {
        console.log(`[SocketMock] Event emitted: ${event}`, data);
        // Simulate some response based on the event
        if (event === SocketEvents.update_transaction) await handleTransactionStatus(data, this.store, SocketEvents.update_transaction);

        if (event === SocketEvents.update_transaction_status)
            await handleTransactionStatus(data, this.store, SocketEvents.update_transaction_status);
    }

    triggerEvent(event: string, data?: any) {
        if (this.listeners[event]) this.listeners[event].forEach((callback) => callback(data));
    }

    off() {
        this.triggerEvent('disconnect');
    }

    getSocket() {
        return this;
    }
}
