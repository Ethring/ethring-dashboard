import { ModuleType } from '@/shared/models/enums/modules.enum';

export const routes = [
    {
        path: '',
        redirect: '/dashboard',
    },
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        children: [
            {
                path: 'assets',
                name: 'Dashboard Assets',
                component: () => import('@/pages/Dashboard/Assets.vue'),
            },
            {
                path: 'defi',
                name: 'Dashboard De-Fi assets',
                component: () => import('@/pages/Dashboard/DeFi.vue'),
            },
        ],
    },
    {
        path: '/restake',
        name: 'Restake',
        children: [
            {
                path: 'assets',
                name: 'Restake Assets',
                component: () => import('@/pages/Restake/Assets.vue'),
            },
            {
                path: 'defi',
                name: 'Restake De-Fi assets',
                component: () => import('@/pages/Restake/DeFi.vue'),
            },
        ],
    },
    {
        path: '/connect-wallet',
        name: 'Connect wallet',
        component: () => import('@/pages/Dashboard/index.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Not Found',
        component: () => import('@/pages/general/NotFound.vue'),
    },
    // {
    //     path: '/send',
    //     name: 'Zomet - Send',
    //     meta: {
    //         key: ModuleType.send,
    //         isAuth: true,
    //     },
    //     component: () => import('@/layouts/ModulesLayout.vue'),
    //     props: {
    //         component: 'SimpleSend',
    //         tabs: [
    //             {
    //                 title: 'simpleSend.title',
    //                 active: true,
    //                 to: '/send',
    //             },
    //         ],
    //     },
    // },
];
