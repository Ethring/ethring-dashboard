import useNotification from '@/compositions/useNotification';

import { getAllowance, getApproveTx, getSwapTx, getBridgeTx } from '../../../api/services';

import { STATUSES } from '../constants';

const SUCCESS_CALLBACKS = {
    GET_SWAP_TX: getSwapTx,
    GET_BRIDGE_TX: getBridgeTx,
    GET_ALLOWANCE: getAllowance,
    GET_APPROVE_TX: getApproveTx,
    CLEAR_AMOUNTS: ({ store }) => {
        store.dispatch('tokenOps/setReceiverAddress', null);
        store.dispatch('tokenOps/setSrcAmount', 0);
        store.dispatch('tokenOps/setDstAmount', 0);
    },
};

const NOTIFICATION_TYPE_BY_STATUS = {
    [STATUSES.SUCCESS]: 'success',
    [STATUSES.FAILED]: 'error',
};

const statusNotification = (status, { store, type = 'Transfer', displayHash, explorerLink, successCallback, failCallback }) => {
    const { showNotification, closeNotification } = useNotification();

    const notificationBody = {
        key: `${status}-tx`,
        type: NOTIFICATION_TYPE_BY_STATUS[status],
        title: `${type} ${status}`,
        description: `"${displayHash}" ${status}`,
    };

    if (explorerLink) {
        notificationBody.description = `Click to view ${type} "${displayHash}" on explorer`;

        notificationBody.onClick = () => {
            window.open(explorerLink, '_blank');
            closeNotification(`${status}-tx`);
        };

        notificationBody.style = {
            cursor: 'pointer',
        };
    }

    switch (status) {
        case STATUSES.SUCCESS:
            if (!successCallback) {
                return showNotification(notificationBody);
            }

            if (successCallback) {
                console.log('successCallback', successCallback);

                const { action, requestParams } = successCallback;

                if (!action || !SUCCESS_CALLBACKS[action]) {
                    return showNotification(notificationBody);
                }

                if (SUCCESS_CALLBACKS[action]) {
                    console.log('SUCCESS_CALLBACKS[action]', SUCCESS_CALLBACKS[action]);
                    SUCCESS_CALLBACKS[action]({ ...requestParams, store });
                }
            }

            return showNotification(notificationBody);

        case STATUSES.FAILED:
            console.log('failCallback', failCallback);
            return showNotification(notificationBody);
    }
};

export const handleTransactionStatus = (transaction, store) => {
    store.dispatch('txManager/setTransactionForSign', null);
    const { closeNotification } = useNotification();

    const { metaData, module, status, txHash = '' } = transaction;

    const { explorerLink, type, successCallback = null, failCallback = null } = metaData || {};

    const displayHash = txHash.slice(0, 8) + '...' + txHash.slice(-8);

    closeNotification(`waiting-${txHash}-tx`);

    store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

    return statusNotification(status, { store, type, displayHash, explorerLink, successCallback, failCallback });
};
