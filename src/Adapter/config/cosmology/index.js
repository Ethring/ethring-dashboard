import { chains, assets } from 'chain-registry';

// * Constants
const NET_TYPE = 'mainnet';
const NET_STATUS = 'live';
const MINT_SCAN_EXPLORER = 'https://www.mintscan.io';
const STANDARD_SLIP_44 = '118';

// * Helpers
const isActiveChain = ({ network_type, status, explorers, staking, chain_id }) =>
    network_type === NET_TYPE &&
    status === NET_STATUS &&
    explorers.some(({ url }) => url.startsWith(MINT_SCAN_EXPLORER)) &&
    staking &&
    chain_id;

// * Filtered chains
const activeChains = chains.filter(isActiveChain);
const differentSlip44 = activeChains.filter(({ slip44 }) => slip44 != STANDARD_SLIP_44);

export default {
    chains: activeChains,
    differentSlip44,
    assets,
};
