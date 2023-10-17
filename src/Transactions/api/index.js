import axios from 'axios';

const TX_MANAGER_URL = process.env.VUE_APP_TX_MANAGER || null;

const txMangerIns = axios.create({
    baseURL: TX_MANAGER_URL,
    headers: { 'Cache-Control': 'no-cache' },
    timeout: 15000,
    timeoutErrorMessage: 'Request timed out',
});

export const getTransactionsByRequestID = async (requestID) => {
    try {
        const URL = `${TX_MANAGER_URL}/transactions/${requestID}`;
        const response = await txMangerIns.get(URL);

        if (response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch {
        return null;
    }
};

export const getTransactionForAccount = async (account, ecosystem, chainId) => {
    try {
        const URL = `${TX_MANAGER_URL}/transactions?account=${account}&ecosystem=${ecosystem}&chainId=${chainId}`;
        const response = await txMangerIns.get(URL);

        if (response.status === 200) {
            return response.data.data;
        }
    } catch {
        return null;
    }
};

export const createTransactionsQueue = async (transactions = []) => {
    try {
        console.log('TX_MANAGER_URL', TX_MANAGER_URL);
        const URL = `${TX_MANAGER_URL}/transactions`;

        const response = await txMangerIns.post(URL, {
            transactions,
        });

        if (response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const addTransactionToExistingQueue = async (requestID, transaction) => {
    try {
        const URL = `${TX_MANAGER_URL}/transactions/add/${requestID}`;

        const response = await txMangerIns.post(URL, {
            transaction,
        });

        if (response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateTransaction = async (id, transaction) => {
    try {
        const URL = `${TX_MANAGER_URL}/transactions/${id}`;
        const response = await txMangerIns.put(URL, {
            transaction,
        });

        if (response.status === 200) {
            return response.data.data;
        }
    } catch {
        return null;
    }
};
