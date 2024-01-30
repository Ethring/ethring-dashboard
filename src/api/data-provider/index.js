// Export configs from data-provider
export * from './chains';

// Axios instance
import axiosInstance from '../axios';

const PROVIDER_URL = import.meta.env.VITE_APP_DATA_PROVIDER_URL || null;

export const getBalancesByAddress = async (
    net,
    address = null,
    { fetchTokens = true, fetchIntegrations = true, fetchNfts = true, signal } = {}
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
