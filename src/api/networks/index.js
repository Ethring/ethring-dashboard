import axios from 'axios';
import defaultChains from './default-chains';

export const getNetworksConfig = async () => {
    try {
        return await axios.get(`${process.env.VUE_APP_ZOMET_CORE_API_URL}/networks`);
    } catch (err) {
        return { error: err.message };
    }
};

export const getChainList = async () => {
    try {
        const chains = (await axios.get(`${process.env.VUE_APP_ZOMET_CORE_API_URL}/networks/chain-list`)).data;
        if (!chains || !chains.length) {
            return defaultChains;
        }
        return chains;
    } catch (err) {
        console.error({ error: err.message });
        return defaultChains;
    }
};
