import { io } from 'socket.io-client';
import { handleTransactionStatus } from '../../Transactions/shared/utils/tx-statuses';

const TX_MANAGER_URL = process.env.VUE_APP_TX_MANAGER || undefined;

class SocketInstance {
    constructor() {
        this.socket = io(TX_MANAGER_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 30,
            reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected');
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
        });
    }

    init(store) {
        if (!this.socket) {
            return console.warn('[Socket] Socket is not initialized');
        }

        this.socket.on('update_transaction', (data) => handleTransactionStatus(data, store));
        this.socket.on('update_transaction_status', (data) => handleTransactionStatus(data, store));

        console.info('[Socket] Subscribed to transaction updates');
    }

    getSocket() {
        return this.socket;
    }

    addressSubscription(account) {
        this.socket.emit('address-subscribe', account);
    }

    addressesSubscription(addresses, walletAddress) {
        if (!this.socket) {
            console.warn('[Socket] Socket is not initialized');
            return;
        }

        for (const chain in addresses) {
            const { address } = addresses[chain] || {};

            if (!address) {
                continue;
            }

            if (address === walletAddress) {
                continue;
            }

            this.addressSubscription(address);
        }

        this.addressSubscription(walletAddress);

        console.info('[Socket] Subscribed to address updates');
    }
}

export default new SocketInstance();
