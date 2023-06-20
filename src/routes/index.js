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
        component: () => import(/* webpackChunkName: "about" */ '../views/Swap.vue'),
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
        component: () => import(/* webpackChunkName: "about" */ '../views/Send.vue'),
    },
    {
        path: '/swap/select-token',
        name: 'swap/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../components/dynamic/swaps/SelectToken.vue'),
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
        component: () => import(/* webpackChunkName: "about" */ '../views/Bridge.vue'),
    },
    {
        path: '/bridge/select-token',
        name: 'bridge/select-token',
        meta: {
            isAuth: true,
        },
        component: () => import(/* webpackChunkName: "about" */ '../components/dynamic/bridge/SelectToken.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach(guards);

export default router;
