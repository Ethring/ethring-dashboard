import { ModuleType } from '@/shared/models/enums/modules.enum';

export const routes = [
    {
        path: '',
        redirect: '/restake',
    },
    {
        path: '/',
        redirect: '/restake',
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard/Assets.vue'),
    },
    {
        path: '/restake',
        name: 'Restake',
        component: () => import('@/pages/Restake/Assets.vue'),
    },
    {
        path: '/connect-wallet',
        name: 'Connect wallet',
        component: () => import('@/pages/Dashboard/Assets.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Not Found',
        component: () => import('@/pages/general/NotFound.vue'),
    },
];
