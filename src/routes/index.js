import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from '@/views/Dashboard.vue';
import guards from './guards';

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
        component: () => import(/* webpackChunkName: "about" */ '../layouts/SwapLayout.vue'),
    },
    {
        path: '/stake',
        name: 'stake',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../views/Stake.vue'),
    },
    {
        path: '/send',
        name: 'send',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../layouts/SendLayout.vue'),
    },
    {
        path: '/swap/select-token',
        name: 'swap/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../components/dynamic/swaps/SelectToken.vue'),
    },
    {
        path: '/send/select-token',
        name: 'send/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../components/dynamic/send/SelectToken.vue'),
    },
    // {
    //     path: '/kit',
    //     name: 'kit',
    //     meta: {
    //         isAuth: true,
    //     },
    //     component: () =>
    //         import(/* webpackChunkName: "about" */ '../views/Kit.vue'),
    // },
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: () => import(/* webpackChunkName: "about" */ '../views/NotFound.vue'),
    },
    {
        path: '/bridge',
        name: 'bridge',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../layouts/BridgeLayout.vue'),
    },
    {
        path: '/bridge/select-token',
        name: 'bridge/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../components/dynamic/bridge/SelectToken.vue'),
    },
    {
        path: '/superSwap',
        name: 'superSwap',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../layouts/SuperSwapLayout.vue'),
    },
    {
        path: '/superSwap/select-token',
        name: 'superSwap/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../components/dynamic/superswap/SelectToken.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(guards);

export default router;
