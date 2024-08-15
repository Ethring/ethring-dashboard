import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const MITOSIS_API = 'https://api.expedition.mitosis.org/v1/';

const apiClient = new ApiClient({
    baseURL: MITOSIS_API,
    headers: {
        origin: 'https://app.mitosis.org',
    },
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;
