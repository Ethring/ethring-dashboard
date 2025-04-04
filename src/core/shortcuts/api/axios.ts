import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============

const apiClient = new ApiClient({
    baseURL: process.env.SHORTCUTS_API as string,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;

// ============== API Client Settings End ==============
