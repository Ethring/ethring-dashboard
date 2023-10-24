import { useLocalStorage } from '@vueuse/core';

import useAdapter from '@/Adapter/compositions/useAdapter';

import redirectOrStay from '@/shared/utils/routes';

const adapterIsConnected = useLocalStorage('adapter:isConnected', false);

export default async (to, from, next) => {
    const isAuthRequired = to.meta.isAuth;

    if (!adapterIsConnected && to.name !== 'Connect wallet' && isAuthRequired) {
        return next('/');
    }

    if (to.name === 'Connect wallet' && adapterIsConnected) {
        return next('/');
    }

    const { currentChainInfo } = useAdapter();

    if (!redirectOrStay(to.path, currentChainInfo.value)) {
        return next('/');
    }

    next(redirectOrStay(to.path, currentChainInfo.value));
};
