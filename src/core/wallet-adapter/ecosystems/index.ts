import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

import { ICosmosAdapter, IEthereumAdapter } from '@/core/wallet-adapter/models/ecosystem-adapter';

import EthereumAdapter from '@/core/wallet-adapter/ecosystems/ethereum';
import CosmosAdapter from '@/core/wallet-adapter/ecosystems/cosmos';

/**
 * Returns the adapter based on the specified ecosystem.
 * @param ecosystem The ecosystem value ('EVM' or 'COSMOS').
 * @returns The corresponding adapter for the specified ecosystem, or null if the ecosystem is not supported.
 */

const AdapterFacade = (ecosystem: Ecosystems) => {
    if (!ecosystem) throw new Error('Ecosystem is required.');

    switch (ecosystem) {
        case Ecosystem.evm:
        case Ecosystem.EVM:
            return EthereumAdapter as IEthereumAdapter;

        // case Ecosystem.cosmos:
        // case Ecosystem.COSMOS:
        //     return CosmosAdapter as ICosmosAdapter;

        default:
            throw new Error(`Ecosystem '${ecosystem}' is not supported.`);
    }
};

export default AdapterFacade;
