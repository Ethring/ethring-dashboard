import { computed, h, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

import { addTransactionToExistingQueue, createTransactionsQueue, getTransactionsByRequestID, updateTransaction } from '@/Transactions/api';

import useNotification from '@/compositions/useNotification';

import { STATUSES } from '@/shared/models/enums/statuses.enum';

import { captureTransactionException } from '@/app/modules/sentry';

import logger from '@/shared/logger';

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
        await updateTransaction(id, transaction);

        // if (updatedTransaction) {
        //     const { requestID } = updatedTransaction;

        //     const txs = await getTransactionsByRequestID(requestID);

        //     store.dispatch('txManager/setCurrentRequestID', requestID);
        //     store.dispatch('txManager/setTransactionsForRequestID', { requestID, transactions: txs });
        // }
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
        closeNotification('prepare-tx');

        const ignoreErrors = ['rejected', 'denied'];
        const ignoreRegex = new RegExp(ignoreErrors.join('|'), 'i');

        try {
            captureTransactionException({ error, module, id, tx, wallet: connectedWallet.value });
        } catch (e) {
            console.error('Sentry -> captureTransactionException -> Unable to capture exception:', e);
        }

        const strError = typeof error === 'string' ? error : JSON.stringify(error);

        showNotification({
            key: 'error-tx',
            type: 'error',
            title: 'Transaction error',
            description: strError,
            duration: 3,
        });

        if (!ignoreRegex.test(strError)) {
            await store.dispatch('tokenOps/setOperationResult', {
                module,
                result: {
                    status: 'error',
                    title: 'Transaction error',
                    description: 'Transaction failed. Please check the error message and try again',
                    error: strError,
                },
            });
        }

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
    const handleSuccessfulSign = async (id, response, { metaData = {}, module = null } = {}) => {
        closeNotification('prepare-tx');

        const { transactionHash } = response;

        await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

        if (!transactionHash && id) {
            logger.warn('Transaction hash is not provided, setting transaction status to failed.');
            await updateTransactionById(id, { status: STATUSES.FAILED });
            return response;
        }

        const explorerLink = getTxExplorerLink(transactionHash, currentChainInfo.value);

        const displayHash = transactionHash.slice(0, 8) + '...' + transactionHash.slice(-8);

        await store.dispatch('tokenOps/setOperationResult', {
            module,
            result: {
                status: 'success',
                title: 'Transaction sent to blockchain',
                description:
                    'Transaction successfully sent to blockchain, but the transaction still pending. Please wait for confirmation.',
                link: explorerLink,
            },
        });

        showNotification({
            explorerLink,
            key: `waiting-${transactionHash}-tx`,
            type: 'info',
            title: `Waiting for confirmation: "${displayHash}"`,
            txHash: transactionHash,
            wait: true,
            duration: 0,
        });

        if (transactionHash && !id) {
            logger.warn('Request ID is not provided, skipping transaction update. Transaction hash:', transactionHash);
            // !Close notification, because we don't have request ID to update transaction status
            closeNotification(`waiting-${transactionHash}-tx`);
            return response;
        }

        await updateTransactionById(id, {
            txHash: transactionHash,
            metaData: {
                ...metaData,
                explorerLink,
            },
        });

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

        // Handle success response
        return await handleSuccessfulSign(id, response, { metaData, module });
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

        await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: true });

        try {
            if (action && ACTIONS_FOR_TX[action]) {
                txFoSign = await ACTIONS_FOR_TX[action](parameters);
            }
        } catch (error) {
            console.error('prepareTransaction error', error);
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

            await store.dispatch('tokenOps/setOperationResult', {
                module,
                result: {
                    status: 'error',
                    title: 'Prepare transaction error',
                    description: 'Error occurred while preparing transaction. Please check the error message and try again',
                    error: JSON.stringify(error),
                },
            });

            return {
                error,
            };
        }

        try {
            const response = await signSend(txFoSign);
            return await handleSignedTxResponse(id, response, { metaData, module, tx: txFoSign });
        } catch (error) {
            closeNotification('prepare-tx');
            console.error('signSend error', error);
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
            return {
                error,
            };
        }
    };

    onMounted(() => {
        store.dispatch('txManager/setIsWaitingTxStatusForModule', { module: 'all', isWaiting: false });
    });

    return {
        currentRequestID,
        transactionForSign,

        signAndSend,

        createTransactions,
        updateTransactionById,
        addTransactionToRequestID,
    };
}
