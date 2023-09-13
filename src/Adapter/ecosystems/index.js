import { ECOSYSTEMS } from '@/Adapter/config';

import EthereumAdapter from '@/Adapter/ecosystems/ethereum';
import CosmosAdapter from '@/Adapter/ecosystems/cosmos';

const AdapterFacade = (ecosystem) => {
    if (!ecosystem) {
        return null;
    }

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

export default AdapterFacade;
