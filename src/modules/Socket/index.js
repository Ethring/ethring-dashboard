import { io } from 'socket.io-client';
import { handleTransactionStatus } from '../../Transactions/shared/utils/tx-statuses';
import { ECOSYSTEMS } from '../../Adapter/config';
import { useStore } from 'vuex';

const TX_MANAGER_URL = process.env.VUE_APP_TX_MANAGER || undefined;

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
            console.info(`[Socket] Connected: ${new Date().toLocaleTimeString()}`);
            this.onReconnect();
        });

        this.socket.on('disconnect', () => {
            console.warn(`[Socket] Disconnected, ${new Date().toLocaleTimeString()}}`);
        });

        this.socket.on('reconnect', () => {
            console.warn('[Socket] Reconnected');
            this.onReconnect();
        });
    }

    onReconnect() {
        this.addressesSubscription(this.addresses[ECOSYSTEMS.EVM], this.walletAddress);
        this.addressesSubscription(this.addresses[ECOSYSTEMS.COSMOS], this.walletAddress);

        this.socket.on('update_transaction', (data) => handleTransactionStatus(data, this.store));
        this.socket.on('update_transaction_status', (data) => handleTransactionStatus(data, this.store));

        console.info('[Socket] Subscribed to transaction updates');
    }

    init() {
        this.store = useStore();

        if (!this.socket) {
            return console.warn('[Socket] Socket is not initialized');
        }
    }

    getSocket() {
        return this.socket;
    }

    addressSubscription(account) {
        this.socket.emit('address-subscribe', account);
        console.log(`[Socket] Subscribed to address updates: ${account}`);
    }

    setAddresses = (addresses, walletAddress, ecosystem) => {
        this.addresses[ecosystem] = addresses;
        this.walletAddress = walletAddress;

        this.addressSubscription(walletAddress);
        this.addressesSubscription(addresses, walletAddress);
    };

    addressesSubscription(addresses, walletAddress = null) {
        if (!this.socket) {
            return console.warn('[Socket] Socket is not initialized');
        }

        if (!walletAddress) {
            return console.warn('[Socket] Wallet address is empty');
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
