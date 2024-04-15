import { FINISHED_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { getAllowance, getApproveTx, getBridgeTx, getSwapTx } from '../../../api/services';

import { detectUpdateForAccount } from '@/services/track-update-balance/utils';
import useNotification from '@/compositions/useNotification';

const SUCCESS_CALLBACKS = {
    GET_SWAP_TX: getSwapTx,
    GET_BRIDGE_TX: getBridgeTx,
    GET_ALLOWANCE: getAllowance,
    GET_APPROVE_TX: getApproveTx,
};

const NOTIFICATION_TYPE_BY_STATUS = {
    [STATUSES.SUCCESS]: 'success',
    [STATUSES.FAILED]: 'error',
};

const statusNotification = (status, { store, id = null, metaData, txHash, displayHash, explorerLink, successCallback, failCallback }) => {
    const { showNotification } = useNotification();

    const hashKey = txHash ? `waiting-${txHash}-tx` : `${status}-tx`;
    const notificationKey = hashKey || `tx-${id}`;

    const notificationBody = {
        key: notificationKey,
        type: NOTIFICATION_TYPE_BY_STATUS[status],
        duration: 4,
        title: metaData.notificationTitle || `Transaction ${status}`,
        description: metaData.notificationDescription || displayHash,
        duration: 6,
        progress: true,
    };

    explorerLink && (notificationBody.explorerLink = explorerLink);

    switch (status) {
        case STATUSES.SUCCESS:
            if (!successCallback) {
                return showNotification(notificationBody);
            }

            if (successCallback) {
                const { action, requestParams } = successCallback;

                if (!action || !SUCCESS_CALLBACKS[action]) {
                    return showNotification(notificationBody);
                }

                if (SUCCESS_CALLBACKS[action]) {
                    SUCCESS_CALLBACKS[action]({ ...requestParams, store });
                }
            }

            return showNotification(notificationBody);

        case STATUSES.FAILED:
            // console.log('failCallback', failCallback);
            return showNotification(notificationBody);
    }
};

export const handleTransactionStatus = async (transaction, store, event) => {
    try {
        await detectUpdateForAccount(event, store, transaction);
    } catch (error) {
        console.error('Error on detectUpdateForAccount', error);
    }

    const { id, metaData, module, status, txHash = '' } = transaction;
    const { explorerLink, successCallback = null, failCallback = null } = metaData || {};

    if (FINISHED_STATUSES.includes(status)) {
        await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
    } else {
        await store.dispatch('txManager/setCurrentRequestID', null);
    }

    const displayHash = (txHash && txHash.slice(0, 8) + '...' + txHash.slice(-8)) || txHash;

    statusNotification(status, { store, id, metaData, txHash, displayHash, explorerLink, successCallback, failCallback });

    return status;
};
