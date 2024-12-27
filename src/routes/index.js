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
        component: () => import('@/pages/Dashboard/index.vue'),
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
