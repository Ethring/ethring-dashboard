import HttpRequest from '@/shared/utils/request';

export const getNetworksConfig = async (ecosystem) => {
    try {
        const response = await HttpRequest.get(`${import.meta.env.VITE_ZOMET_CORE_API_URL}/networks/${ecosystem}`);

        if (response.status === 200) {
            localStorage.setItem(`networks/${ecosystem}`, JSON.stringify(response.data));
            localStorage.setItem('configUpdatedAt', new Date().toISOString());
            return response.data;
        }
        return {};
    } catch (err) {
        return { error: err.message };
    }
};

export const getTokensListByNetwork = async (network) => {
    try {
        return await HttpRequest.get(`${import.meta.env.VITE_ZOMET_CORE_API_URL}/networks/${network}/tokens`);
    } catch (err) {
        console.error({ error: err.message });
        return {};
    }
};
