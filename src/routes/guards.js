import { useLocalStorage } from '@vueuse/core';
import UIConfig from '@/config/ui';

import useAdapter from '@/Adapter/compositions/useAdapter';

const adapterIsConnected = useLocalStorage('adapter:isConnected', false);

export default async (to, from, next) => {
    const isAuthRequired = to.meta.isAuth;

    if (!adapterIsConnected && to.name !== 'Connect wallet' && isAuthRequired) {
        return next('/connect-wallet');
    }

    if (to.name === 'Connect wallet' && adapterIsConnected) {
        return next('/');
    }

    const { currentChainInfo } = useAdapter();

    const { net, ecosystem } = currentChainInfo.value || {};

    if (!net || !ecosystem) {
        return next();
    }

    const { sidebar } = UIConfig(net, ecosystem);

    const { path } = to;

    const isSidebarModule = sidebar.find((item) => item.to === path);

    if (!isSidebarModule) {
        return next();
    }

    if (isSidebarModule && isSidebarModule.disabled) {
        return next('/');
    }

    return next();
};
