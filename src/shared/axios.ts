// TODO: Add error handling and tracking to Sentry

import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { captureSentryException } from '@/app/modules/sentry';

interface ApiConfig {
    baseURL: string;
    headers?: Record<string, string>;
    timeout?: number;
}

class ApiClient {
    private instance: AxiosInstance;

    constructor(config: ApiConfig) {
        const {
            baseURL,
            headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            ...args
        } = config;

        this.instance = axios.create({
            baseURL,
            headers,
            ...args,
        });

        // Interceptor for response
        this.instance.interceptors.response.use(this.handleSuccessResponse, this.handleErrorResponse);
    }

    private handleSuccessResponse(response: AxiosResponse) {
        return response;
    }

    private async handleErrorResponse(error: any) {
        const originalRequest = error.config;

        if (error.code === 'ECONNABORTED' && !originalRequest.retry) {
            originalRequest.retry = true;

            try {
                // Retry request
                return await axios(originalRequest);
            } catch (retryError) {
                // Retry failed
                return Promise.reject(retryError);
            }
        }

        if (error.response && error.response.status === 400) captureSentryException(error);

        return Promise.reject(error);
    }

    public getInstance(): AxiosInstance {
        return this.instance;
    }
}

export default ApiClient;
