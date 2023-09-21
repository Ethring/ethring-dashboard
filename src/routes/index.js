import { createRouter, createWebHashHistory } from 'vue-router';

import guards from './guards';

import Dashboard from '@/views/Dashboard.vue';

const routes = [
    {
        path: '/main',
        name: 'main',
        component: Dashboard,
    },
    {
        path: '/swap',
        name: 'swap',
        meta: {
            isAuth: true,
            isSwap: true,
        },
        component: () => import('../layouts/SwapLayout.vue'),
    },
    {
        path: '/send',
        name: 'send',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/SendLayout.vue'),
    },
    {
        path: '/swap/select-token',
        name: 'swap/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import('../components/dynamic/swaps/SelectToken.vue'),
    },
    {
        path: '/send/select-token',
        name: 'send/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import('../components/dynamic/send/SelectToken.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: () => import('../views/NotFound.vue'),
    },
    // {
    //     path: '/bridge',
    //     name: 'bridge',
    //     meta: {
    //         isAuth: true,
    //     },
    //     component: () => import('../layouts/BridgeLayout.vue'),
    // },
    // {
    //     path: '/bridge/select-token',
    //     name: 'bridge/select-token',
    //     meta: {
    //         isAuth: true,
    //     },
    //     component: () => import('../components/dynamic/bridge/SelectToken.vue'),
    // },
    {
        path: '/superSwap',
        name: 'superSwap',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/SuperSwapLayout.vue'),
    },
    {
        path: '/superSwap/select-token',
        name: 'superSwap/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import('../components/dynamic/superswap/SelectToken.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(guards);

export default router;
