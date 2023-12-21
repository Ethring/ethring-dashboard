import HttpRequest from '@/shared/utils/request';

export const getNetworksConfig = async (ecosystem) => {
    try {
        const response = await HttpRequest.get(`${process.env.VUE_APP_ZOMET_CORE_API_URL}/networks/${ecosystem}`);

        if (response.status === 200) {
            localStorage.setItem(`networks/${ecosystem}`, JSON.stringify(response.data));
            return response.data;
        }
        return {};
    } catch (err) {
        return { error: err.message };
    }
};

export const getTokensListByNetwork = async (network) => {
    try {
        return await HttpRequest.get(`${process.env.VUE_APP_ZOMET_CORE_API_URL}/networks/${network}/tokens`);
    } catch (err) {
        console.error({ error: err.message });
        return {};
    }
};
