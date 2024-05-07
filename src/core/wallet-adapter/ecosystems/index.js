import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

import EthereumAdapter from '@/core/wallet-adapter/ecosystems/ethereum';
import CosmosAdapter from '@/core/wallet-adapter/ecosystems/cosmos';

const AdapterFacade = (ecosystem) => {
    if (!ecosystem) return null;

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
