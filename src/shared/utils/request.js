import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import * as AxiosLogger from 'axios-logger';
import adapter from 'axios/lib/adapters/xhr';

const HttpRequest = axios.create({
    baseURL: '/',
    headers: { 'Cache-Control': 'no-cache' },
    adapter: cacheAdapterEnhancer(adapter),
});

HttpRequest.interceptors.request.use(AxiosLogger.requestLogger);

export default HttpRequest;
