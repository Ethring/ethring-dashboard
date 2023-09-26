import axios from 'axios';

const PROVIDER_URL = process.env.VUE_APP_DATA_PROVIDER_URL || null;

const dataProviderIns = axios.create({
    baseURL: PROVIDER_URL,
    headers: { 'Cache-Control': 'no-cache' },
    timeout: 10000,
    timeoutErrorMessage: 'Request timed out',
});

export const getBalancesByAddress = async (
    net,
    address = null,
    { fetchTokens = true, fetchIntegrations = true, fetchNfts = false } = {}
) => {
    if (!PROVIDER_URL || !net || !address) {
        return null;
    }

    try {
        const URL = `${PROVIDER_URL}/balances?net=${net}&address=${address}&tokens=${fetchTokens}&integrations=${fetchIntegrations}&nfts=${fetchNfts}`;
        const response = await dataProviderIns.get(URL);

        if (response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch {
        return null;
    }
};
