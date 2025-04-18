import { DISALLOW_TO_UPDATE_STATUES, DISALLOW_UPDATE_TYPES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { SocketEvents } from '@/shared/models/enums/socket-events.enum';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';
import { IUpdateBalanceByHash } from '../../shared/models/types/UpdateBalance';

export const detectUpdateForAccount = async (socketEvent: string, store: any, transaction: any = {}) => {
    const { metaData, status, txHash = '', account, chainId, ecosystem } = transaction || {};
    const { type, params = {} } = metaData || {};

    if (socketEvent !== SocketEvents.update_transaction_status) return;

    if (DISALLOW_TO_UPDATE_STATUES.includes(status) || DISALLOW_UPDATE_TYPES.includes(type) || !txHash) return;

    const isBridge = type === TRANSACTION_TYPES.BRIDGE;
    const isCosmosBridge = ecosystem === Ecosystem.COSMOS && [TRANSACTION_TYPES.BRIDGE, TRANSACTION_TYPES.DEX].includes(type);

    const { net = '', fromNet = '', toNet = '', receiverAddress = null } = params || {};
    const network = net || fromNet;

    const chains = [];

    if ((isBridge || isCosmosBridge) && network && toNet) {
        chains.push(network);
        chains.push(toNet);
    } else {
        chains.push(chainId);
    }

    const storeParams: IUpdateBalanceByHash = {
        hash: txHash,
        addresses: {
            [network]: account,
        },
    };

    const addresses = store.getters['adapters/getAddressesByEcosystemList'](ecosystem) || {};

    const dstNet = addresses[toNet] || {};

    const { address: dstAddress } = dstNet || {};

    let recAddress = receiverAddress;

    if (typeof receiverAddress === 'object' && toNet) {
        const recAddObj = receiverAddress || {};
        recAddress = recAddObj[toNet];
    }

    const isDiffAddress = recAddress && recAddress !== dstAddress;

    if ((isBridge || isCosmosBridge) && !isDiffAddress) storeParams.addresses[toNet] = dstAddress;

    await store.dispatch('updateBalance/setUpdateBalanceForAddress', storeParams);
};
