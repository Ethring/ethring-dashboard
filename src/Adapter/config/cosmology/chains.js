import { chains, assets, ibc } from 'chain-registry';
import { getIbcAssets } from '@chain-registry/utils';

import { DATA_PROVIDER_COSMOS_CHAINS } from '../../../api/data-provider/chains';

// * Constants
const NET_TYPE = 'mainnet';
const NET_STATUS = 'live';
const MINT_SCAN_EXPLORER = 'https://www.mintscan.io';
const STANDARD_SLIP_44 = '118';

// * Helpers
const isActiveChain = ({ network_type, status, explorers, staking, chain_id, chain_name }) =>
    network_type === NET_TYPE &&
    status === NET_STATUS &&
    explorers.some(({ url }) => url.startsWith(MINT_SCAN_EXPLORER)) &&
    staking &&
    chain_id &&
    DATA_PROVIDER_COSMOS_CHAINS.includes(chain_name);

const getIbcAssetsForChain = (chain) => {
    const [ibcResponse] = getIbcAssets(chain, ibc, assets) || [];

    if (!ibcResponse) {
        return [];
    }

    const { assets: ibcAssets = [] } = ibcResponse || {};

    if (!ibcAssets.length) {
        return [];
    }

    return ibcAssets;
};

// * Filtered chains
const activeChains = chains.filter(isActiveChain);

const differentSlip44 = activeChains.filter(({ slip44 }) => slip44 != STANDARD_SLIP_44);

// * Assets
const ibcAssetsByChain = {};

for (const chain of activeChains) {
    ibcAssetsByChain[chain.chain_name] = getIbcAssetsForChain(chain.chain_name) || [];
}

// * Export
export { activeChains, differentSlip44, assets, ibcAssetsByChain };
