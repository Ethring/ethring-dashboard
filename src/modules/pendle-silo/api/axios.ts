import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const PENDLE_SDK_API = 'https://api-v2.pendle.finance/sdk/api';

const apiClient = new ApiClient({
    baseURL: PENDLE_SDK_API,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;

// ============== API Client Settings End ==============

// PT - Principal Token
// YT - Yield Token
