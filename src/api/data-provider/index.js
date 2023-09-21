import axios from 'axios';

export const getBalancesByAddress = async (
    net,
    address = null,
    { fetchTokens = true, fetchIntegrations = true, fetchNfts = false } = {}
) => {
    if (!net || !address) {
        return null;
    }

    try {
        const URL = `${process.env.VUE_APP_DATA_PROVIDER_URL}/balances?net=${net}&address=${address}&tokens=${fetchTokens}&integrations=${fetchIntegrations}&nfts=${fetchNfts}`;

        const response = await axios.get(URL);

        if (response.status === 200) {
            return response.data.data;
        }

        return null;
    } catch {
        return null;
    }
};
