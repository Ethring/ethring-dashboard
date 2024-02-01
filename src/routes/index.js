import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '',
        redirect: '/main',
    },
    {
        path: '/',
        redirect: '/main',
    },
    {
        path: '/main',
        name: 'Overview',
        meta: {
            key: 'main',
        },
        component: () => import('../views/Dashboard.vue'),
    },
    {
        path: '/send',
        name: 'Zomet - Send',
        meta: {
            key: 'send',
            isAuth: true,
        },
        component: () => import('../layouts/ModulesLayout.vue'),
        props: {
            component: 'SimpleSend',
            tabs: [
                {
                    title: 'simpleSend.title',
                    active: true,
                    to: '/send',
                },
                {
                    title: 'simpleBridge.title',
                    active: false,
                    to: '/bridge',
                },
            ],
        },
    },
    {
        path: '/bridge',
        name: 'Zomet - Bridge',
        meta: {
            isAuth: true,
            key: 'bridge',
        },
        component: () => import('../layouts/ModulesLayout.vue'),
        props: {
            component: 'SimpleBridge',
            tabs: [
                {
                    title: 'simpleSend.title',
                    active: false,
                    to: '/send',
                },
                {
                    title: 'simpleBridge.title',
                    active: true,
                    to: '/bridge',
                },
            ],
        },
    },
    {
        path: '/swap',
        name: 'Zomet - Swap',
        meta: {
            isAuth: true,
            key: 'swap',
        },
        component: () => import('../layouts/ModulesLayout.vue'),
        props: {
            component: 'SimpleSwap',
            tabs: [
                {
                    title: 'simpleSwap.title',
                    active: true,
                    to: '/swap',
                },
            ],
        },
    },
    {
        path: '/super-swap',
        name: 'Zomet - Super Swap',
        meta: {
            isAuth: true,
            key: 'superSwap',
        },
        component: () => import('../layouts/ModulesLayout.vue'),
        props: {
            component: 'SuperSwap',
            tabs: [
                {
                    title: 'superSwap.title',
                    active: true,
                    to: '/super-swap',
                },
            ],
        },
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

router.beforeResolve((to, from, next) => {
    if (to.name) {
        document.title = to.name;
    }

    if (to.hash && to.hash.includes('/main')) {
        const pathWithoutHash = to.path.replace(to.hash, '');
        next(`/main${pathWithoutHash}`);
    } else {
        next();
    }
});

export default router;
