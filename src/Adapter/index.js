import { ECOSYSTEMS } from '@/Adapter/config';

import EthereumAdapter from '@/Adapter/ecosystems/ethereum';
import CosmosAdapter from '@/Adapter/ecosystems/cosmos';

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
