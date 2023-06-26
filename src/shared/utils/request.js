import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import adapter from 'axios/lib/adapters/xhr';

const HttpRequest = axios.create({
    baseURL: '/',
    headers: { 'Cache-Control': 'no-cache' },
    adapter: cacheAdapterEnhancer(adapter),
});

export default HttpRequest;
