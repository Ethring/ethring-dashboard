import ApiClient from '@/shared/axios';

import { AxiosError, AxiosResponse } from 'axios';

import { BaseResponse, Response } from '@/shared/models/types/BaseResponse';

// ============== API Client Settings Start ==============

const apiClient = new ApiClient({
    baseURL: process.env.BRIDGE_DEX_API as string,
});

const axiosInstance = apiClient.getInstance();

axiosInstance.interceptors.response.use(
    (response: BaseResponse) => {
        const { ok, data, error }: Response = response.data || {};

        if (!ok) return Promise.reject({ data, error });

        return Promise.resolve(data);
    },
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
