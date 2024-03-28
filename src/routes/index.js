import { ModuleType } from '@/shared/models/enums/modules.enum';

export const routes = [
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
        component: () => import('@/pages/Dashboard.vue'),
    },
    {
        path: '/send',
        name: 'Zomet - Send',
        meta: {
            key: ModuleType.send,
            isAuth: true,
        },
        component: () => import('@/layouts/ModulesLayout.vue'),
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
            key: ModuleType.bridge,
        },
        component: () => import('@/layouts/ModulesLayout.vue'),
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
            key: ModuleType.swap,
        },
        component: () => import('@/layouts/ModulesLayout.vue'),
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
            key: ModuleType.superSwap,
        },
        component: () => import('@/layouts/ModulesLayout.vue'),
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
        path: '/shortcuts',
        name: 'Zomet - Shortcuts',
        meta: {
            key: 'shortcut',
        },
        component: () => import('@/pages/Shortcut.vue'),
        // component: () => import('@/pages/Shortcuts.vue'),
    },
    {
        path: '/shortcuts/:id',
        name: 'Shortcut details',
        meta: {
            key: 'shortcuts-details',
        },
        component: () => import('@/components/shortcuts/ShortcutDetails.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Not Found',
        component: () => import('@/pages/NotFound.vue'),
    },
];
