import axios from 'axios';

const PROVIDER_URL = process.env.VUE_APP_DATA_PROVIDER_URL || null;

const axiosInstance = axios.create();

// Interceptor для ответов
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const originalRequest = error.config;

        // Check Timeout Error 504
        if (error.response.status === 504 && !originalRequest._retry) {
            originalRequest._retry = true;
            return axiosInstance(originalRequest);
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

    try {
        const URL = `${PROVIDER_URL}/balances?net=${net}&address=${address}&tokens=${fetchTokens}&integrations=${fetchIntegrations}&nfts=${fetchNfts}`;

        const params = {
            url: URL,
            timeout: 5000,
            responseType: 'json',
            withCredentials: false,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        };

        signal && (params.cancelToken = signal);

        const response = await axiosInstance.get(params.url, params);

        if (response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch {
        return null;
    }
};
