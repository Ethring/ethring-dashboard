import axios from 'axios';

const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
    timeout: 10000,
    responseType: 'json',
});

// Interceptor для ответов
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.code === 'ECONNABORTED' && !originalRequest.retry) {
            originalRequest.retry = true;

            try {
                // Resend request
                return await axios(originalRequest);
            } catch (retryError) {
                // Return error
                return Promise.reject(retryError);
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;
