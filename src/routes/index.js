import { createRouter, createWebHashHistory } from 'vue-router';

import guards from './guards';

import Dashboard from '@/views/Dashboard.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Dashboard,
    },
    {
        path: '/main',
        name: 'Main Dashboard',
        component: Dashboard,
    },
    {
        path: '/swap',
        name: 'Swap Page',
        meta: {
            isAuth: true,
            isSwap: true,
        },
        component: () => import('../layouts/SwapLayout.vue'),
    },
    {
        path: '/send',
        name: 'Send Page',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/SendLayout.vue'),
    },
    {
        path: '/bridge',
        name: 'Bridge Page',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/BridgeLayout.vue'),
    },
    // {
    //     path: '/superSwap',
    //     name: 'Super Swap Page',
    //     meta: {
    //         isAuth: true,
    //     },
    //     component: () => import('../layouts/SuperSwapLayout.vue'),
    // },
    // {
    //     path: '/superSwap/select-token',
    //     name: 'superSwap/select-token',
    //     meta: {
    //         isAuth: true,
    //     },
    //     component: () => import('../components/dynamic/superswap/SelectToken.vue'),
    // },
    {
        path: '/:module/select-token',
        name: 'Select Token Page',
        component: () => import('../components/dynamic/SearchSelectToken.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: () => import('../views/NotFound.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(guards);

export default router;
