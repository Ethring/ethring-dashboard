import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const SHORTCUTS_API = 'https://shortcuts-backend.3ahtim54r.ru/';

const apiClient = new ApiClient({
    baseURL: SHORTCUTS_API,
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;

// ============== API Client Settings End ==============
