import { ModuleType } from '@/shared/models/enums/modules.enum';

export const routes = [
    {
        path: '',
        redirect: '/shortcuts',
    },
    {
        path: '/',
        redirect: '/shortcuts',
    },
    {
        path: '/main',
        name: 'Wallet Overview',
        meta: {
            key: 'main',
        },
        component: () => import('@/pages/Dashboard.vue'),
        children: [
            {
                path: '',
                name: 'Wallet Overview',
                alias: 'portfolio',
                component: () => import('@/components/app/Assets.vue'),
            },
            {
                path: 'nfts',
                name: "Wallet's NFTs",
                alias: 'nfts',
                component: () => import('@/components/app/NFTs.vue'),
            },
            {
                path: 'tokens',
                name: "Wallet's Assets List",
                alias: 'tokens',
                component: () => import('@/components/app/TokensList.vue'),
            },
        ],
    },
    {
        path: '/connect-wallet',
        name: 'Connect wallet',
        meta: {
            key: 'connect-wallet',
        },
        component: () => import('@/pages/Dashboard.vue'),
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
        component: () => import('@/pages/shortcuts/Shortcut.vue'),
    },
    {
        path: '/shortcuts/:id',
        name: 'Shortcut details',
        meta: {
            key: 'shortcuts-details',
        },
        component: () => import('@/pages/shortcuts/ShortcutDetails.vue'),
    },
    {
        path: '/shortcuts/profile/:author',
        name: 'Shortcut Author',
        meta: {
            key: 'shortcut-author',
        },
        component: () => import('@/pages/shortcuts/ShortcutProfile.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Not Found',
        component: () => import('@/pages/general/NotFound.vue'),
    },
    {
        path: '/portfolio',
        name: 'Zomet - portfolio',
        meta: {
            key: 'portfolio',
        },
        component: () => import('@/pages/portfolio/Portfolio.vue'),
    },
    {
        path: '/withdraw/:id',
        name: 'Withdraw',
        meta: {
            key: 'withdraw',
        },
        component: () => import('@/pages/portfolio/Withdraw.vue'),
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
