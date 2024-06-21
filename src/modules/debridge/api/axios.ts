import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const DEBRIDGE_SDK_API = 'https://points-api.debridge.finance/api/Points/';

const apiClient = new ApiClient({
    baseURL: DEBRIDGE_SDK_API,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;
