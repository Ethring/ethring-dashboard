import { computed, h, inject, onMounted } from 'vue';
import { useStore } from 'vuex';

import { addTransactionToExistingQueue, createTransactionsQueue, getTransactionsByRequestID, updateTransaction } from '@/Transactions/api';

import useNotification from '@/compositions/useNotification';

import { STATUSES, DISALLOW_UPDATE_TYPES, TRANSACTION_TYPES } from '@/shared/models/enums/statuses.enum';

import { ModuleType } from '@/modules/bridge-dex/enums/ServiceType.enum';

import { captureTransactionException } from '@/app/modules/sentry';

import { capitalize } from 'lodash';

import logger from '@/shared/logger';

import useAdapter from '@/Adapter/compositions/useAdapter';

export default function useTransactions() {
    const store = useStore();

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
        return await updateTransaction(id, transaction);

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

        return tx;
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
            duration: 6,
            progress: true
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

        if (!transactionHash && id) {
            logger.warn('Transaction hash is not provided, setting transaction status to failed.');
            await updateTransactionById(id, { status: STATUSES.FAILED });
            return response;
        }

        const explorerLink = getTxExplorerLink(transactionHash, currentChainInfo.value);

        const displayHash = transactionHash.slice(0, 8) + '...' + transactionHash.slice(-8);

        const { type, params } = metaData || {};

        const TARGET_TYPE = TRANSACTION_TYPES[type];

        const isSameNetwork = params.tokens.from?.chain === params.tokens.to?.chain;

        if (!DISALLOW_UPDATE_TYPES.includes(type)) {
            console.log('handleSuccessfulSign -> metaData', metaData);

            await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

            const operationResultDesc = module === ModuleType.send ? `${params.amount} ${params.tokens.from.symbol}` : `${params.dstAmount} ${params.tokens.to.symbol}`;

            let operationResultTitle = `Initiated a ${module}`;

            if ([TRANSACTION_TYPES.DEX, TRANSACTION_TYPES.SWAP, TRANSACTION_TYPES.BRIDGE].includes(TARGET_TYPE)) {
                operationResultTitle += isSameNetwork ? ` on <img class="network-icon" src="${params.tokens.from.chainLogo}"/> ${capitalize(params.fromNet)} from ${params.amount} to` : ` from <img class="network-icon" src="${params.tokens.from.chainLogo}"/> ${capitalize(params.tokens.from.chain)} to <img class="network-icon" src="${params.tokens.to.chainLogo}"/> ${capitalize(params.tokens.to.chain)}`;
            } else if ([TRANSACTION_TYPES.SEND].includes(TARGET_TYPE)) {
                operationResultTitle += ` on <img class="network-icon" src="${params.tokens.from.chainLogo}" /> ${capitalize(params.fromNet)} `;
            }

            await store.dispatch('tokenOps/setOperationResult', {
                module,
                result: {
                    status: 'success',
                    title: operationResultTitle,
                    description: operationResultDesc,
                    link: explorerLink,
                },
            });
        }

        showNotification({
            explorerLink,
            key: `waiting-${transactionHash}-tx`,
            type: 'info',
            title: `Waiting for confirmation`,
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
    const signAndSend = async (transaction, { ecosystem, chain }) => {
        const ACTIONS_FOR_TX = {
            prepareTransaction: async (parameters, txParams = {}) => await prepareTransaction(parameters, { ecosystem, ...txParams }),
            formatTransactionForSign: async (parameters, txParams = {}) =>
                await formatTransactionForSign(parameters, { ecosystem, ...txParams }),
        };

        if (!transaction) {
            return;
        }

        const { id, module, ...txBody } = transaction;

        const { parameters, metaData } = txBody;

        const { action = null, params: txParams = {} } = metaData || {};

        let txFoSign = parameters;

        await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: true });

        try {
            if (!action || !ACTIONS_FOR_TX[action]) {
                console.error('Unknown action', action);
            }

            txFoSign = await ACTIONS_FOR_TX[action](parameters, txParams);
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

            throw error;
        }

        let response = null;

        try {
            response = await signSend(txFoSign, { ecosystem, chain });
            console.log('signSend response', response);
        } catch (error) {
            closeNotification('prepare-tx');
            console.error('signSend error', error);
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
            throw error;
        }

        if (response && response.error) {
            closeNotification('prepare-tx');
            console.log('signSend error', response.error);
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
            throw new Error(response.error);
        }

        if (response && response.isCanceled) {
            return null;
        }

        try {
            await handleSignedTxResponse(id, response, { metaData, module, tx: txFoSign });
        } catch (error) {
            console.error('handleSignedTxResponse error', error);
            throw error;
        }

        const { transactionHash } = response;

        return transactionHash;
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
