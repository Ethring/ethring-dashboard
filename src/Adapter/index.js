import { ECOSYSTEMS } from '@/Adapter/config';

import EthereumAdapter from '@/Adapter/Blocknative';
import CosmosAdapter from '@/Adapter/Cosmology';

const checkAdapter = (ecosystem = ECOSYSTEMS.EVM) => {
    switch (ecosystem) {
        case ECOSYSTEMS.EVM:
            return EthereumAdapter;

        case ECOSYSTEMS.COSMOS:
            return CosmosAdapter;

        default:
            console.warn(`Ecosystem '${ecosystem}' is not supported.`);
            return null;
    }
};

export default checkAdapter;
