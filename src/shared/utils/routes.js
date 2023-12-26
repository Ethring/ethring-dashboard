import { ECOSYSTEMS } from '@/Adapter/config';

const NOT_SUPPORT_COSMOS = ['/super-swap'];

export default (path, currentChainInfo) => {
    const { ecosystem = null } = currentChainInfo || {};

    if (!ecosystem) {
        return true;
    }

    if (ecosystem === ECOSYSTEMS.COSMOS && NOT_SUPPORT_COSMOS.includes(path)) {
        return false;
    }

    return true;
};
