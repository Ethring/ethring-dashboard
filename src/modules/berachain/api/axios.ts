import ApiClient from '@/shared/axios';

// ============== API Client Settings Start ==============
const BERACHAIN_API = 'https://bartio-bex-router.berachain-devnet.com/';

const apiClient = new ApiClient({
    baseURL: BERACHAIN_API,
    headers: {
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
    },
});

const axiosInstance = apiClient.getInstance();

export default axiosInstance;
