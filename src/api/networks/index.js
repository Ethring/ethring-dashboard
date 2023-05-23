import axios from 'axios';

export const getNetworksConfig = async () => {
    try {
        return (await axios.get(`${process.env.VUE_APP_ZOMET_CORE_API_URL}/networks`)).data;
    } catch (err) {
        return { error: err.message };
    }
};
