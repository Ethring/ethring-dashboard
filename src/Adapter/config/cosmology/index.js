// Chains for COSMOS ecosystem
import { activeChains, differentSlip44, assets, ibcAssetsByChain } from './chains';

// Custom Registry for stargate
import { aminoTypes, registry } from './stargateClientOptions';

export default {
    // Chains
    chains: activeChains,
    differentSlip44,
    // Assets
    assets,
    ibcAssetsByChain,
    // Custom Registry for stargate
    aminoTypes,
    registry,
};
