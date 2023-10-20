import { computed, h } from 'vue';
import { useStore } from 'vuex';

import { LoadingOutlined } from '@ant-design/icons-vue';

import { addTransactionToExistingQueue, createTransactionsQueue, getTransactionsByRequestID, updateTransaction } from '../api';

import useAdapter from '@/Adapter/compositions/useAdapter';
import useNotification from '@/compositions/useNotification';

import Socket from '@/modules/Socket';

import { STATUSES } from '../shared/constants';
import { handleTransactionStatus } from '../shared/utils/tx-statuses';

export default function useTransactions() {
    const store = useStore();
    const { showNotification } = useNotification();

    const transactionForSign = computed(() => store.getters['txManager/transactionForSign']);
    const currentRequestID = computed(() => store.getters['txManager/currentRequestID']);

    const { signSend, currentChainInfo, getTxExplorerLink, prepareTransaction, formatTransactionForSign } = useAdapter();

    // * Create transactions queue
    const createTransactions = async (transactions) => {
        const createdTransactions = await createTransactionsQueue(transactions);

        if (createdTransactions) {
            const [tx] = createdTransactions;

            const { requestID } = tx;

            store.dispatch('txManager/setTransactionForSign', tx);
            store.dispatch('txManager/setCurrentRequestID', requestID);
            store.dispatch('txManager/setTransactionsForRequestID', { requestID, transactions });
        }

        return createdTransactions;
    };

    // * Update transaction by id
    const updateTransactionById = async (id, transaction) => {
        const updatedTransaction = await updateTransaction(id, transaction);

        if (updatedTransaction) {
            const { requestID } = updatedTransaction;

            const txs = await getTransactionsByRequestID(requestID);

            store.dispatch('txManager/setCurrentRequestID', requestID);
            store.dispatch('txManager/setTransactionsForRequestID', { requestID, transactions: txs });
        }
    };

    // * Add transaction to existing queue
    const addTransactionToRequestID = async (requestID, transaction) => {
        const transactions = await getTransactionsByRequestID(requestID);

        if (!transactions.length) {
            return;
        }

        const txToSave = {
            ...transaction,
            index: transactions.length,
        };

        const tx = await addTransactionToExistingQueue(requestID, txToSave);

        if (!tx) {
            return;
        }

        store.dispatch('txManager/setTransactionForSign', tx);

        const { requestID: reqID } = tx;

        store.dispatch('txManager/setCurrentRequestID', reqID);

        const txs = await getTransactionsByRequestID(reqID);

        store.dispatch('txManager/setTransactionsForRequestID', { requestID: reqID, transactions: txs });
    };

    // * Handle signed tx response
    const handleSignedTxResponse = async (id, signedTx, { metaData, module }) => {
        if (signedTx.error && id) {
            showNotification({
                key: 'error-tx',
                type: 'error',
                title: 'Transaction error',
                description: JSON.stringify(signedTx.error || 'Unknown error'),
                duration: 5,
            });

            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

            await updateTransactionById(id, { status: STATUSES.REJECTED });

            return signedTx;
        }

        store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: true });

        return handleSuccessfulSign(id, signedTx, { metaData });
    };

    // * Handle successful sign
    const handleSuccessfulSign = async (id, signedTx, { metaData = {} } = {}) => {
        const { transactionHash } = signedTx;

        if (transactionHash && !id) {
            return signedTx;
        }

        if (!transactionHash && id) {
            await updateTransactionById(id, { status: STATUSES.FAILED });
            return signedTx;
        }

        const explorerLink = getTxExplorerLink(transactionHash, currentChainInfo.value);

        await updateTransactionById(id, {
            txHash: transactionHash,
            metaData: {
                ...metaData,
                explorerLink,
            },
        });

        const displayHash = transactionHash.slice(0, 8) + '...' + transactionHash.slice(-8);

        showNotification({
            key: `waiting-${transactionHash}-tx`,
            type: 'info',
            title: `Waiting for transaction ${displayHash} confirmation`,
            description: 'Please wait for transaction confirmation',
            icon: h(LoadingOutlined, {
                spin: true,
                'data-qa': `waiting-${transactionHash}-tx`,
            }),
            duration: 0,
        });

        return signedTx;
    };

    // * Sign and send transaction
    const signAndSend = async (transaction) => {
        const ACTIONS_FOR_TX = {
            prepareTransaction: async (parameters) => await prepareTransaction(parameters),
            formatTransactionForSign: (parameters) => formatTransactionForSign(parameters),
        };

        if (!transaction) {
            return;
        }

        const { id, module, ...txBody } = transaction;

        const { parameters, metaData } = txBody;

        const { action = null } = metaData || {};

        let txFoSign = parameters;

        if (action && ACTIONS_FOR_TX[action]) {
            txFoSign = await ACTIONS_FOR_TX[action](parameters);
        }

        try {
            const signedTx = await signSend(txFoSign);
            return await handleSignedTxResponse(id, signedTx, { metaData, module });
        } catch (error) {
            console.error('signSend error', error);
        }
    };

    // * Subscribe to socket events for transaction statuses updates
    if (Socket.getSocket()) {
        const socket = Socket.getSocket();
        socket.on('update_transaction_status', (data) => handleTransactionStatus(data, store));
    }

    return {
        currentRequestID,
        transactionForSign,

        signAndSend,

        createTransactions,
        updateTransactionById,
        addTransactionToRequestID,
    };
}
