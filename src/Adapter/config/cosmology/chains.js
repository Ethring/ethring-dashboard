import { asset_lists } from '@chain-registry/assets/main';
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
    explorers?.some(({ url }) => url.startsWith(MINT_SCAN_EXPLORER)) &&
    staking &&
    chain_id &&
    DATA_PROVIDER_COSMOS_CHAINS.includes(chain_name);

const assets = asset_lists;

// * Export
export { isActiveChain, assets, STANDARD_SLIP_44 };
