import { createRouter, createWebHistory } from 'vue-router';

import guards from './guards';

import Dashboard from '@/views/Dashboard.vue';

const routes = [
    {
        path: '/',
        name: 'Overview',
        component: Dashboard,
    },
    {
        path: '/main',
        name: 'Overview',
        component: Dashboard,
    },
    {
        path: '/swap',
        name: 'Swap Page',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/SwapLayout.vue'),
    },
    {
        path: '/send',
        name: 'Zomet - Send',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/SendLayout.vue'),
    },
    {
        path: '/bridge',
        name: 'Zomet - Bridge',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/BridgeLayout.vue'),
    },
    {
        path: '/connect-wallet',
        name: 'Connect wallet',
        component: () => import('../views/ConnectWallet.vue'),
    },
    {
        path: '/superSwap',
        name: 'Super Swap Page',
        meta: {
            isAuth: true,
        },
        component: () => import('../layouts/SuperSwapLayout.vue'),
    },
    {
        path: '/:module/select-token',
        name: 'Select Token',
        component: () => import('../components/dynamic/SearchSelectToken.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Not Found',
        component: () => import('../views/NotFound.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(guards);

router.beforeResolve((to, from, next) => {
    if (to.name) {
        document.title = to.name;
    }

    next();
});

export default router;
