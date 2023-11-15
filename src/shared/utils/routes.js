import UIConfig from '@/config/ui';
import { ECOSYSTEMS } from '@/Adapter/config';

const NOT_SUPPORT_COSMOS = ['/super-swap', '/swap'];

export default (path, currentChainInfo) => {
    const { net = null, ecosystem = null } = currentChainInfo || {};

    if (!net || !ecosystem) {
        return true;
    }

    if (ecosystem === ECOSYSTEMS.COSMOS && NOT_SUPPORT_COSMOS.includes(path)) {
        return false;
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
