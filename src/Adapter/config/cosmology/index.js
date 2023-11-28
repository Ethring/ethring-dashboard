import { assets, ibc } from 'chain-registry';

// Chains for COSMOS ecosystem
import { activeChains, differentSlip44 } from './chains';

// Custom Registry for stargate
import { aminoTypes, registry } from './stargateClientOptions';

export default {
    chains: activeChains,
    differentSlip44,
    assets,
    ibcAssets: ibc,
    aminoTypes,
    registry,
};
