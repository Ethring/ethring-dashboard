import { io } from 'socket.io-client';

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

    getSocket() {
        return this.socket;
    }

    addressSubscription(account) {
        this.socket.emit('address-subscribe', account);
    }
}

export default new SocketInstance();
