import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const PORTAL_FI_API = 'https://apps.3ahtim54r.ru/srv-portal-fi-add-portal-fi/api';

const apiClient = new ApiClient({
    baseURL: PORTAL_FI_API,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;

// ============== API Client Settings End ==============
