import { bech32 } from 'bech32';

import { DATA_PROVIDER_COSMOS_CHAINS } from '@/core/balance-provider/models/enums';

function decodeBech32(address) {
    const decoded = bech32.decode(address);
    return {
        prefix: decoded.prefix,
        data: Buffer.from(bech32.fromWords(decoded.words)),
    };
}

export function reEncodeWithNewPrefix(prefix, originalAddress) {
    const decoded = decodeBech32(originalAddress);
    return bech32.encode(prefix, bech32.toWords(decoded.data));
}

export const isDifferentSlip44 = (chainName, differentSlip44) => differentSlip44.some((diffChain) => diffChain.chain_name === chainName);

export function isSVG(str = '') {
    return str?.includes('<svg') || false;
}

export const isActiveChain = ({ network_type, status, explorers, staking, chain_id }) => {
    // Constants
    const NET_TYPE = 'mainnet';
    const NET_STATUS = 'live';
    const MINT_SCAN_EXPLORER = 'https://www.mintscan.io';

    return (
        network_type === NET_TYPE &&
        status === NET_STATUS &&
        explorers?.some(({ url }) => url.startsWith(MINT_SCAN_EXPLORER)) &&
        staking &&
        chain_id
    );
};

export const isDefaultChain = ({ chain_name }) => {
    return DATA_PROVIDER_COSMOS_CHAINS.includes(chain_name);
};
