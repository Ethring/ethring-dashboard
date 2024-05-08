import { Socket, io } from 'socket.io-client';

import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

import { SocketEvents } from '@/shared/models/enums/socket-events.enum';

import { handleTransactionStatus } from '@/core/transaction-manager/shared/utils/tx-statuses';

import logger from '@/shared/logger';
import { AddressByChain } from '@/shared/models/types/Address';
import _ from 'lodash';

const TX_MANAGER_URL = process.env.TX_MANAGER_API || undefined;

type Ecosystems = keyof typeof ECOSYSTEMS;

interface CustomSocket extends Socket {
    addresses?: {
        [key in Ecosystems]?: {
            [key: string]: string;
        };
    };
}

class SocketInstance {
    store = null;
    socket: CustomSocket;

    constructor() {
        if (!TX_MANAGER_URL) {
            logger.error('[Socket] TX_MANAGER_API is not defined');
            throw new Error('[Socket] TX_MANAGER_API is not defined');
        }

        this.socket = io(TX_MANAGER_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 30,
            reconnectionDelay: 2000,
        });

        if (!this.socket) {
            logger.error('[Socket] Socket is not initialized');
            throw new Error('[Socket] Socket is not initialized');
        }

        this.socket.on('connect', () => {
            logger.info(`[Socket] Connected: ${new Date().toLocaleTimeString()}`);

            if (!this.socket.addresses) return logger.warn('[Socket] Addresses are not set');
            if (!this.socket.addresses) return logger.warn('[Socket] Addresses are not set');

            if (this.socket.addresses['EVM']) this.subscribeToAddress('EVM');
            if (this.socket.addresses['COSMOS']) this.subscribeToAddress('COSMOS');
        });

        this.socket.on('disconnect', () => {
            logger.warn(`[Socket] Disconnected, ${new Date().toLocaleTimeString()}`);
        });

        this.socket.on('reconnect', (attempt) => {
            logger.warn('[Socket] Reconnection', attempt);
        });

        this.socket.on(SocketEvents.update_transaction, async (data) => {
            await handleTransactionStatus(data, this.store, SocketEvents.update_transaction);
        });

        this.socket.on(SocketEvents.update_transaction_status, async (data) => {
            await handleTransactionStatus(data, this.store, SocketEvents.update_transaction_status);
        });
    }

    init(store: any) {
        if (!this.store) this.store = store;

        if (!this.socket) return logger.warn('[Socket] Socket is not initialized');
    }

    getSocket(): CustomSocket {
        return this.socket;
    }

    setAddresses(addresses: AddressByChain, ecosystem: Ecosystems, { walletAccount }: { walletAccount: string }) {
        !this.socket.addresses && (this.socket.addresses = {});
        !this.socket.addresses[ecosystem] && (this.socket.addresses[ecosystem] = {});

        for (const chain in addresses) {
            const { address } = addresses[chain] || {};

            const targetKey = ecosystem === ECOSYSTEMS.EVM ? walletAccount : `${walletAccount}-${chain}`;

            if (!this.socket.addresses[ecosystem][targetKey]) {
                this.socket.emit(SocketEvents['address-subscribe'], address);
                this.socket.addresses[ecosystem][targetKey] = address;
                logger.info(`[Socket] Subscribed to address: ${address}`);
            }
        }

        // !Removing another account addresses for the same ecosystem
        if (ecosystem === 'COSMOS' && this.socket.addresses[ecosystem])
            _.keys(this.socket.addresses[ecosystem]).forEach((targetKey: string) => {
                if (!this.socket.addresses) return logger.warn('[Socket] Addresses are not set');
                if (!this.socket.addresses[ecosystem]) return logger.warn('[Socket] Addresses are not set');
                if (!targetKey.startsWith(walletAccount)) delete this.socket.addresses[ecosystem][targetKey];
            });
    }

    subscribeToAddress(ecosystem: Ecosystems) {
        if (!this.socket.addresses) return logger.warn('[Socket] Addresses are not set');

        if (!this.socket.addresses[ecosystem]) return logger.warn(`[Socket] Addresses for ${ecosystem} are not set`);

        for (const targetKey in this.socket.addresses[ecosystem]) {
            const address = this.socket.addresses[ecosystem][targetKey];

            this.socket.emit(SocketEvents['address-subscribe'], address);
            logger.info(`[Socket] Subscribed to address: ${address}`);
        }
    }
}

export default new SocketInstance();
