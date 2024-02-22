import { TRANSACTION_TYPES, DISALLOW_TO_UPDATE_STATUES, DISALLOW_UPDATE_TYPES } from '@/shared/models/enums/statuses.enum';

import { SocketEvents } from '@/shared/models/enums/socket-events.enum';

export const detectUpdateForAccount = async (socketEvent: string, store: any, transaction: any = {}) => {
    const { metaData, status, txHash = '', account, chainId, ecosystem } = transaction || {};
    const { type, from = null, to = null, receiverAddress = null } = metaData || {};

    if (socketEvent !== SocketEvents.update_transaction_status) {
        return;
    }

    if (DISALLOW_TO_UPDATE_STATUES.includes(status) || DISALLOW_UPDATE_TYPES.includes(type) || !txHash) {
        return;
    }

    const isBridge = type === TRANSACTION_TYPES.BRIDGE;

    const chains = [];

    if (isBridge && from && to) {
        chains.push(from);
        chains.push(to);
    } else {
        chains.push(chainId);
    }

    const storeParams = {
        hash: txHash,
        address: account,
        ecosystem,
        chains,
    };

    for (const chain of chains) {
        if (chainId === chain) {
            continue;
        }

        if (!receiverAddress) {
            continue;
        }

        const isDiffAddress = receiverAddress && receiverAddress !== account;

        if (isBridge && isDiffAddress) {
            chains.splice(chains.indexOf(chain), 1);
            continue;
        }
    }

    await store.dispatch('updateBalance/setUpdateBalanceForAddress', storeParams);
};
