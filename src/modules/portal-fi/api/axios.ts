import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============

const apiClient = new ApiClient({
    baseURL: process.env.PORTAL_FI_API,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;

// ============== API Client Settings End ==============
