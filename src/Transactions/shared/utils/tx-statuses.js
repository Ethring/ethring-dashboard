import useNotification from '@/compositions/useNotification';

import { STATUSES } from '../constants';

const statusNotification = (status, { store, type = 'Transfer', displayHash, explorerLink, successCallback, failCallback }) => {
    const { showNotification, closeNotification } = useNotification();

    const NOTIFICATION_TYPE_BY_STATUS = {
        [STATUSES.SUCCESS]: 'success',
        [STATUSES.FAILED]: 'error',
    };

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
            if (successCallback) {
                const { action, targetKey } = successCallback;
                console.log('action', action, targetKey);
                store.dispatch(action, targetKey);
            }

            return showNotification(notificationBody);

        case STATUSES.FAILED:
            console.log('failCallback', failCallback);
            return showNotification(notificationBody);
    }
};

export const handleTransactionStatus = (transaction, store) => {
    store.dispatch('txManager/setTransactionForSign', null);

    const { metaData, status, txHash = '' } = transaction;

    const { explorerLink, type, successCallback = null, failCallback = null } = metaData || {};

    const displayHash = txHash.slice(0, 8) + '...' + txHash.slice(-8);

    return statusNotification(status, { store, type, displayHash, explorerLink, successCallback, failCallback });
};
