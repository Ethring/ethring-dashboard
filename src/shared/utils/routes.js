import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

// const NOT_SUPPORT_COSMOS = ['/super-swap'];
const NOT_SUPPORT_COSMOS = [];

export default (path, currentChainInfo) => {
    const { ecosystem = null } = currentChainInfo || {};

    if (!ecosystem) return false;

    if (ecosystem === Ecosystem.COSMOS && NOT_SUPPORT_COSMOS.includes(path)) return false;

    return true;
};
