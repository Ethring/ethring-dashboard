import { TRANSACTION_TYPES, DISALLOW_TO_UPDATE_STATUES, DISALLOW_UPDATE_TYPES } from '@/shared/models/enums/statuses.enum';

import { SocketEvents } from '@/shared/models/enums/socket-events.enum';
import { ECOSYSTEMS } from '@/Adapter/config';

export const detectUpdateForAccount = async (socketEvent: string, store: any, transaction: any = {}) => {
    const { metaData, status, txHash = '', account, chainId, ecosystem } = transaction || {};
    const { type, params = {} } = metaData || {};

    if (socketEvent !== SocketEvents.update_transaction_status) {
        return;
    }

    if (DISALLOW_TO_UPDATE_STATUES.includes(status) || DISALLOW_UPDATE_TYPES.includes(type) || !txHash) {
        return;
    }

    const isBridge = type === TRANSACTION_TYPES.BRIDGE;
    const isCosmosBridge = ecosystem === ECOSYSTEMS.COSMOS && [TRANSACTION_TYPES.BRIDGE, TRANSACTION_TYPES.DEX].includes(type);

    const { fromNet = '', toNet = '', receiverAddress = null } = params || {};

    const chains = [];

    if ((isBridge || isCosmosBridge) && fromNet && toNet) {
        chains.push(fromNet);
        chains.push(toNet);
    } else {
        chains.push(chainId);
    }

    const storeParams = {
        hash: txHash,
        address: account,
        ecosystem,
        chains,
    };

    const addresses = store.getters['adapters/getAddressesByEcosystemList'](ecosystem) || {};

    const dstNet = addresses[toNet] || {};

    const { address: dstAddress } = dstNet || {};

    let recAddress = receiverAddress;

    if (typeof receiverAddress === 'object' && toNet) {
        recAddress = receiverAddress[toNet];
    }

    const isDiffAddress = recAddress && recAddress !== dstAddress;

    for (const chain of chains) {
        if (chainId === chain) continue;

        if (!recAddress) continue;

        if ((isBridge || isCosmosBridge) && isDiffAddress) chains.splice(chains.indexOf(chain), 1);
    }

    await store.dispatch('updateBalance/setUpdateBalanceForAddress', storeParams);
};
