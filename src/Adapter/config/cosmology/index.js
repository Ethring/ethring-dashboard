import { chains, assets } from 'chain-registry';

const NET_TYPE = 'mainnet';
const NET_STATUS = 'live';
const EXPLORER_KIND = 'mintscan';

const isActiveChain = (chain) =>
    chain.network_type === NET_TYPE &&
    chain.status === NET_STATUS &&
    chain.explorers.find((explorer) => explorer.kind === EXPLORER_KIND) &&
    chain.staking &&
    chain.chain_id;

export default {
    chains: chains.filter(isActiveChain),
    assets,
};
