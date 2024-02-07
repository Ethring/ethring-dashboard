import { computed, h, inject } from 'vue';
import { useStore } from 'vuex';

import { LoadingOutlined } from '@ant-design/icons-vue';

import { addTransactionToExistingQueue, createTransactionsQueue, getTransactionsByRequestID, updateTransaction } from '@/Transactions/api';

import useNotification from '@/compositions/useNotification';

import { STATUSES } from '@/Transactions/shared/constants';

import { captureTransactionException } from '@/app/modules/sentry';

export default function useTransactions() {
    const store = useStore();

    const useAdapter = inject('useAdapter');

    const { showNotification, closeNotification } = useNotification();

    const transactionForSign = computed(() => store.getters['txManager/transactionForSign']);
    const currentRequestID = computed(() => store.getters['txManager/currentRequestID']);

    const { signSend, currentChainInfo, connectedWallet, getTxExplorerLink, prepareTransaction, formatTransactionForSign } = useAdapter();

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

    /**
     * Handle transaction error response
     *
     * @param {string} id
     * @param {object} response
     * @param {string} error
     * @param {string} module
     * @param {object} tx
     *
     * @returns {object}
     */
    const handleTransactionErrorResponse = async (id, response, error, { module, tx = {} }) => {
        try {
            captureTransactionException({ error, module, id, tx, wallet: connectedWallet.value });
        } catch (e) {
            console.error('Sentry -> captureTransactionException -> Unable to capture exception:', e);
        }

        showNotification({
            key: 'error-tx',
            type: 'error',
            title: 'Transaction error',
            description: JSON.stringify(error || 'Unknown error'),
            duration: 5,
        });

        store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

        await updateTransactionById(id, { status: STATUSES.REJECTED });

        return response;
    };

    /**
     * Handle successful transaction response
     *
     * @param {string} id
     * @param {object} response
     * @param {object} metaData
     *
     * @returns {object}
     */
    const handleSuccessfulSign = async (id, response, { metaData = {} } = {}) => {
        const { transactionHash } = response;

        if (transactionHash && !id) {
            return response;
        }

        if (!transactionHash && id) {
            await updateTransactionById(id, { status: STATUSES.FAILED });
            return response;
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

        // TODO: fix after demo
        if (response.code) {
            closeNotification(`waiting-${transactionHash}-tx`);
        }

        return response;
    };

    /**
     * Handle signed transaction response
     *
     * @param {string} id
     * @param {object} response
     * @param {object} metaData
     * @param {string} module
     * @param {object} tx
     *
     * @returns {object}
     */
    const handleSignedTxResponse = async (id, response, { metaData, module, tx }) => {
        // Handle error response
        if (response.error && id) {
            return await handleTransactionErrorResponse(id, response, response.error, { module, tx });
        }

        // Update transaction waiting status for module
        store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: true });

        // Handle success response
        return await handleSuccessfulSign(id, response, { metaData });
    };

    /**
     * Sign and send transaction
     *
     * @param {object} transaction
     *
     * @returns {object}
     */
    const signAndSend = async (transaction) => {
        const ACTIONS_FOR_TX = {
            prepareTransaction: async (parameters) => await prepareTransaction(parameters),
            formatTransactionForSign: async (parameters) => await formatTransactionForSign(parameters),
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
            const response = await signSend(txFoSign);
            return await handleSignedTxResponse(id, response, { metaData, module, tx: txFoSign });
        } catch (error) {
            console.error('signSend error', error);
        }
    };

    return {
        currentRequestID,
        transactionForSign,

        signAndSend,

        createTransactions,
        updateTransactionById,
        addTransactionToRequestID,
    };
}
