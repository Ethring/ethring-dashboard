import { io } from 'socket.io-client';

import { ECOSYSTEMS } from '@/Adapter/config';

import { SocketEvents } from '@/shared/models/enums/socket-events.enum';

import { handleTransactionStatus } from '@/Transactions/shared/utils/tx-statuses';

import logger from '@/shared/logger';

const TX_MANAGER_URL = process.env.TX_MANAGER_API || undefined;

class SocketInstance {
    store = null;
    socket = null;

    walletAddress = null;

    addresses = {
        [ECOSYSTEMS.EVM]: {},
        [ECOSYSTEMS.COSMOS]: {},
    };

    constructor() {
        this.socket = io(TX_MANAGER_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 30,
            reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
            logger.info(`[Socket] Connected: ${new Date().toLocaleTimeString()}`);
            this.onReconnect();
        });

        this.socket.on('disconnect', () => {
            logger.warn(`[Socket] Disconnected, ${new Date().toLocaleTimeString()}`);
        });

        this.socket.on('reconnect', () => {
            logger.warn('[Socket] Reconnected');
            this.onReconnect();
        });
    }

    onReconnect() {
        console.log('onReconnect', this.addresses, this.walletAddress);
        this.addressesSubscription(this.addresses[ECOSYSTEMS.EVM], this.walletAddress);
        this.addressesSubscription(this.addresses[ECOSYSTEMS.COSMOS], this.walletAddress);

        this.socket.on(SocketEvents.update_transaction, async (data) => {
            await handleTransactionStatus(data, this.store, SocketEvents.update_transaction);
        });

        this.socket.on(SocketEvents.update_transaction_status, async (data) => {
            await handleTransactionStatus(data, this.store, SocketEvents.update_transaction_status);
        });

        logger.info('[Socket] Subscribed to transaction updates');
    }

    init(store) {
        if (!this.store) {
            this.store = store;
        }

        if (!this.socket) {
            return logger.warn('[Socket] Socket is not initialized');
        }
    }

    getSocket() {
        return this.socket;
    }

    addressSubscription(account) {
        this.socket.emit(SocketEvents['address-subscribe'], account);
        logger.log(`[Socket] Subscribed to address updates: ${account}`);
    }

    setAddresses = (addresses, walletAddress, ecosystem) => {
        this.addresses[ecosystem] = addresses;
        this.walletAddress = walletAddress;

        this.addressSubscription(this.walletAddress);
        this.addressesSubscription(this.addresses[ecosystem], this.walletAddress);
    };

    addressesSubscription(addresses, walletAddress = null) {
        if (!this.socket) {
            return logger.warn('[Socket] Socket is not initialized');
        }

        if (walletAddress && walletAddress !== this.walletAddress) {
            this.addressSubscription(walletAddress);
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
    }
}

export default new SocketInstance();
