import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import adapter from 'axios/lib/adapters/xhr';

const CACHE_TIME = 3 * 60 * 60 * 1000; // 3hrs * 60min * 60sec * 1000ms = 3hrs

export default axios.create({
    baseURL: '/',
    headers: { 'Cache-Control': `max-age=${CACHE_TIME}` },
    adapter: cacheAdapterEnhancer(adapter),
});
