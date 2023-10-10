import UIConfig from '@/config/ui';

export default (path, currentChainInfo) => {
    const { net = null, ecosystem = null } = currentChainInfo || {};

    if (!net || !ecosystem) {
        return true;
    }

    const { sidebar } = UIConfig(net, ecosystem);

    const isSidebarModule = sidebar.find((item) => item.to === path);

    if (!isSidebarModule) {
        return true;
    }

    if (isSidebarModule && isSidebarModule.disabled) {
        return false;
    }

    return true;
};
