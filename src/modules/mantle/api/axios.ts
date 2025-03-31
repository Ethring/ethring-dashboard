import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const MANTLE_API = 'https://cmeth-api.mantle.xyz/points/';

const apiClient = new ApiClient({
    baseURL: MANTLE_API,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;
