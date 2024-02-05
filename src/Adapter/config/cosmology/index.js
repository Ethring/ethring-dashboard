// Chains for COSMOS ecosystem
import { isActiveChain, STANDARD_SLIP_44, assets } from './chains';

// Custom Registry for stargate
import { aminoTypes, registry } from './stargateClientOptions';

export default {
    assets,
    isActiveChain,
    STANDARD_SLIP_44,

    // Custom Registry for stargate
    aminoTypes,
    registry,
};
