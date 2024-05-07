import { capitalize } from 'lodash';
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import {
    addTransactionToExistingQueue,
    createTransactionsQueue,
    getTransactionsByRequestID,
    updateTransaction,
} from '@/core/transaction-manager/api';

import useNotification from '@/compositions/useNotification';

import { STATUSES, DISALLOW_UPDATE_TYPES } from '@/shared/models/enums/statuses.enum';
import { TRANSACTION_TYPES } from '@/core/operations/models/enums/tx-types.enum';

import { ModuleType } from '@/shared/models/enums/modules.enum';

import { captureTransactionException } from '@/app/modules/sentry';

import logger from '@/shared/logger';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import { formatNumber } from '@/shared/utils/numbers';

export default function useTransactions() {
    const store = useStore();

    const { showNotification, closeNotification } = useNotification();

    const transactionForSign = computed(() => store.getters['txManager/transactionForSign']);
    const currentRequestID = computed(() => store.getters['txManager/currentRequestID']);

    const { signSend, currentChainInfo, connectedWallet, callTransactionAction, getTxExplorerLink } = useAdapter();

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

        if (!transactions.length) return;

        const txToSave = {
            ...transaction,
            index: transactions.length,
        };

        const tx = await addTransactionToExistingQueue(requestID, txToSave);

        if (!tx) return;

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
        closeNotification(`tx-${id}`);

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
            progress: true,
        });

        if (!ignoreRegex.test(strError))
            store.dispatch('tokenOps/setOperationResult', {
                module,
                result: {
                    status: 'error',
                    title: 'Transaction error',
                    description: 'Transaction failed. Please check the error message and try again',
                    error: strError,
                },
            });

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
        closeNotification(`tx-${id}`);

        const { transactionHash } = response;

        if (!transactionHash && id) {
            logger.warn('Transaction hash is not provided, setting transaction status to failed.');
            await updateTransactionById(id, { status: STATUSES.FAILED });
            return response;
        }

        const explorerLink = getTxExplorerLink(transactionHash, currentChainInfo.value);

        const { type, params, tokens = module === ModuleType.send ? tokens : params.tokens } = metaData || {};

        const TARGET_TYPE = TRANSACTION_TYPES[type];

        const isSameNetwork = tokens.from.chain === tokens.to?.chain;

        if (!DISALLOW_UPDATE_TYPES.includes(type)) {
            await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });

            const operationResultDesc =
                module === ModuleType.send
                    ? `${params.amount} ${tokens.from.symbol}`
                    : `${formatNumber(params.dstAmount)} ${tokens.to?.symbol}`;

            let operationResultTitle = `Initiated a ${module}`;

            const fromChainLogo = `<img class="network-icon" src="${tokens.from?.chainLogo}"/>`;
            const toChainLogo = `<img class="network-icon" src="${tokens.to?.chainLogo}"/>`;

            if ([TRANSACTION_TYPES.DEX, TRANSACTION_TYPES.SWAP, TRANSACTION_TYPES.BRIDGE].includes(TARGET_TYPE))
                operationResultTitle += isSameNetwork
                    ? ` on ${fromChainLogo} ${capitalize(params.fromNet)} from ${params.amount} to`
                    : ` from ${fromChainLogo} ${capitalize(tokens.from.chain)} to ${toChainLogo}" ${capitalize(tokens.to.chain)}`;
            else if ([TRANSACTION_TYPES.TRANSFER].includes(TARGET_TYPE))
                operationResultTitle += ` on ${fromChainLogo} ${capitalize(params.fromNet)} `;

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
        if (response.error && id) return await handleTransactionErrorResponse(id, response, response.error, { module, tx });

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
    const signAndSend = async (transaction, { ecosystem, chain, opInstance }) => {
        if (!transaction) throw new Error('Transaction is not provided');

        const { id, module, ...txBody } = transaction || {};

        const { parameters, metaData } = txBody || {};

        const { action = null, params: txParams = {} } = metaData || {};

        let txFoSign = parameters;

        await store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: true });

        try {
            txFoSign = await callTransactionAction(action, { ecosystem, parameters, txParams });
        } catch (error) {
            console.error('useTransactions -> signAndSend -> callTransactionAction -> error', error);

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
            if (opInstance && opInstance.setTxResponse) opInstance.setTxResponse(response);
        } catch (error) {
            closeNotification(`tx-${id}`);
            console.error('useTransactions -> signAndSend -> error', error);
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
            throw error;
        }

        if (response && response.error) {
            closeNotification(`tx-${id}`);
            console.error('useTransactions -> signAndSend -> Transaction error from provider', response.error);
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
            throw new Error(response.error);
        }

        if (response && response.isCanceled) {
            closeNotification(`tx-${id}`);
            console.error('useTransactions -> signAndSend -> Transaction canceled');
            store.dispatch('txManager/setIsWaitingTxStatusForModule', { module, isWaiting: false });
            throw new Error('Transaction canceled');
        }

        try {
            await handleSignedTxResponse(id, response, { metaData, module, tx: txFoSign });
        } catch (error) {
            console.error('handleSignedTxResponse error', error);
            throw error;
        }

        const { transactionHash = '' } = response || {};

        return transactionHash || null;
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
