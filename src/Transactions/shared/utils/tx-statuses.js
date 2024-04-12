import useNotification from '@/compositions/useNotification';

import { getAllowance, getApproveTx, getSwapTx, getBridgeTx } from '../../../api/services';

import { STATUSES, FINISHED_STATUSES } from '@/shared/models/enums/statuses.enum';

import { detectUpdateForAccount } from '@/services/track-update-balance/utils';

const SUCCESS_CALLBACKS = {
    GET_SWAP_TX: getSwapTx,
    GET_BRIDGE_TX: getBridgeTx,
    GET_ALLOWANCE: getAllowance,
    GET_APPROVE_TX: getApproveTx,
    // CLEAR_AMOUNTS: ({ store }) => {
    //     store.dispatch('tokenOps/setReceiverAddress', null);
    //     store.dispatch('tokenOps/setSrcAmount', null);
    //     store.dispatch('tokenOps/setDstAmount', null);
    // },
};

const NOTIFICATION_TYPE_BY_STATUS = {
    [STATUSES.SUCCESS]: 'success',
    [STATUSES.FAILED]: 'error',
};

const statusNotification = (status, { store, id = null, metaData, txHash, explorerLink, successCallback }) => {
    const { showNotification } = useNotification();

    const hashKey = txHash ? `waiting-${txHash}-tx` : `${status}-tx`;
    const notificationKey = hashKey || `tx-${id}`;

    const notificationBody = {
        key: notificationKey,
        type: NOTIFICATION_TYPE_BY_STATUS[status],
        title: metaData.notificationTitle,
        description: metaData.notificationDescription,
        duration: 6,
        progress: true
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
    const { explorerLink, successCallback = null } = metaData || {};

    if (FINISHED_STATUSES.includes(status)) {
        await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
    } else {
        await store.dispatch('txManager/setCurrentRequestID', null);
    }

    statusNotification(status, { store, id, metaData, txHash, explorerLink, successCallback });

    return status;
};
