import { Socket, io } from 'socket.io-client';
import { values } from 'lodash';

import { SocketEvents } from '@/shared/models/enums/socket-events.enum';

import { BaseType, DP_SDK_PROD_CHAINS_EVM, POOL_BALANCES_CHAINS, Providers, Type } from '../models/enums';
import { storeBalanceForAccount } from '../utils';
import { BalanceType, BalanceResponse } from '../models/types';
import { IAddressByNetwork } from '@/core/wallet-adapter/models/ecosystem-adapter';
import PortalFiApi from '@/modules/portal-fi/api';
import { getBalancesByAddress } from '@/core/balance-provider/api';

import logger from '@/shared/logger';
import { loadBalancesFromContract } from '..';

const APPS_API = process.env.APPS_API || undefined;

class SocketInstance {
    store = null;
    socket: Socket;

    provider: keyof typeof Providers = Providers.GoldRush;
    account: string = '';
    addresses: IAddressByNetwork = {};

    constructor() {
        if (!APPS_API) {
            logger.error('[Socket-data-provider] APPS_API is not defined');
            throw new Error('[Socket-data-provider] APPS_API is not defined');
        }

        this.socket = io(APPS_API, {
            path: '/socket-data-provider/api/socket.io/',
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 30,
            reconnectionDelay: 2000,
        });

        if (!this.socket) {
            logger.error('[Socket-data-provider] Socket is not initialized');
            throw new Error('[Socket] Socket is not initialized');
        }

        this.socket.on('connect', () => {
            logger.info(`[Socket-data-provider] Connected: ${new Date().toLocaleTimeString()}`);
        });

        this.socket.on('disconnect', () => {
            logger.warn(`[Socket-data-provider] Disconnected, ${new Date().toLocaleTimeString()}`);
        });

        this.socket.on('reconnect', (attempt) => {
            logger.warn('[Socket-data-provider] Reconnection', attempt);
        });

        // * Receive balance update, store it in Vuex and IndexedDB
        this.socket.on(SocketEvents.update_balance, async (data: BalanceResponse) => {
            if (!this.store) return logger.warn('[Socket-data-provider] Store is not initialized');
            // ! Skip if chain is not in DP_SDK_PROD_CHAINS_EVM
            if (!values(DP_SDK_PROD_CHAINS_EVM).includes(data.net as any)) return;

            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.store.dispatch('tokens/setLoadingByChain', { chain: data.net, account: this.account, value: true });

                const account = data.address || this.account;

                for (const type in BaseType) {
                    const chainInfo = this.addresses[data.net] || {};

                    await storeBalanceForAccount(type as BalanceType, account, data.net, account, data[type as BaseType], {
                        store: this.store,
                        ...chainInfo,
                    });
                }
            } catch (error) {
                logger.error('[Socket-data-provider] Error on update_balance event', error);
            } finally {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.store.dispatch('tokens/setLoadingByChain', { chain: data.net, account: this.account, value: false });
            }
        });
    }

    init(store: any) {
        if (!this.store) this.store = store;
        if (!this.socket) return logger.warn('[Socket] Socket is not initialized');
    }

    getSocket(): Socket {
        return this.socket;
    }

    subscribeToAddress(provider: keyof typeof Providers, account: string, addresses: IAddressByNetwork) {
        this.provider = provider;
        this.account = account;
        this.addresses = addresses;

        this.socket.emit(SocketEvents.address_subscribe, account);
    }

    async updateBalance(address: string, chain?: string) {
        this.socket.emit(SocketEvents.update_balance, address);

        const chains = chain ? [chain] : POOL_BALANCES_CHAINS;

        for (const net of chains) {
            const chainInfo = this.addresses[net] || {};

            const response = await getBalancesByAddress(net as string, address, { provider: Providers.Enso });
            if (!response) continue;

            await storeBalanceForAccount(Type.pools, address, net, address, response?.tokens, {
                store: this.store,
                ...chainInfo,
                provider: Providers.Enso,
            });
        }

        if (chain !== 'berachain') return;

        try {
            await loadBalancesFromContract('berachain', this.account, {
                ...(this.addresses['berachain'] || {}),
                store: this.store,
            });
        } catch (error) {
            console.error('Error on update balance for berachain', error);
        }
    }

    stopUpdateBalance(account: string) {
        this.socket.emit(SocketEvents.stop_update_balance, account);
    }
}

export default new SocketInstance();
