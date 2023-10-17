import { PLATFORMS } from '@/modules/prices/coingecko/shared/constants';
import methods from '@/modules/prices/coingecko/coingecko.service';

export default {
    PLATFORMS,
    ...methods,
};
