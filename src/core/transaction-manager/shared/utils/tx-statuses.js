import { FINISHED_STATUSES, STATUSES } from '@/shared/models/enums/statuses.enum';
import { detectUpdateForAccount } from '@/services/track-update-balance/utils';

import useNotification from '@/compositions/useNotification';

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
        title: metaData.notificationTitle || `Transaction ${status}`,
        description: metaData.notificationDescription || null,
        duration: 6,
        progress: true,
        wait: txHash ? true : false,
    };

    console.log('statusNotification', status, notificationBody);

    explorerLink && (notificationBody.explorerLink = explorerLink);

    switch (status) {
        case STATUSES.SUCCESS:
        case STATUSES.FAILED:
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

    if (FINISHED_STATUSES.includes(status)) await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
    else await store.dispatch('txManager/setCurrentRequestID', null);

    statusNotification(status, { store, id, metaData, txHash, explorerLink, successCallback });

    return status;
};
