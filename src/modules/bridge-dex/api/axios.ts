// ============== API Client Settings End ==============

import ApiClient from '@/shared/axios';
import { AxiosResponse, AxiosError } from 'axios';

import { BaseResponse, Response } from '@/shared/models/types/BaseResponse';

// ============== API Client Settings Start ==============

const apiClient = new ApiClient({
    baseURL: process.env.BRIDGE_DEX_API as string,
});

const axiosInstance = apiClient.getInstance();

axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosResponse | AxiosError) => {
        const { code, response } = error as AxiosError;

        const { data, statusText } = (response as AxiosResponse) || {};

        const { error: errorMessage } = (data as Response) || {};

        return Promise.reject({
            code,
            message: errorMessage || statusText,
        });
    },
);

export default axiosInstance;

// ============== API Client Settings End ==============
