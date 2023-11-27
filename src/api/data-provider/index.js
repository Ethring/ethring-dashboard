// Export configs from data-provider
export * from './chains';

// Module Imports
import axios from 'axios';

const PROVIDER_URL = process.env.VUE_APP_DATA_PROVIDER_URL || null;

const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
    timeout: 10000,
    responseType: 'json',
    withCredentials: false,
});

// Interceptor для ответов
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.code === 'ECONNABORTED' && !originalRequest.retry) {
            originalRequest.retry = true;

            try {
                // Resend request
                const response = await axios(originalRequest);
                return response;
            } catch (retryError) {
                // Return error
                console.error('Error during request:', error);
                return Promise.reject(retryError);
            }
        }

        return Promise.reject(error);
    }
);

export const getBalancesByAddress = async (
    net,
    address = null,
    { fetchTokens = true, fetchIntegrations = true, fetchNfts = false, signal } = {}
) => {
    if (!PROVIDER_URL || !net || !address) {
        return null;
    }

    const params = {
        url: `${PROVIDER_URL}/balances?net=${net}&address=${address}&tokens=${fetchTokens}&integrations=${fetchIntegrations}&nfts=${fetchNfts}`,
    };

    try {
        signal && (params.cancelToken = signal);

        const response = await axiosInstance.get(params.url, params);

        if (response && response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch (e) {
        console.error('Error while fetching balances from provider:', e);

        return null;
    }
};
