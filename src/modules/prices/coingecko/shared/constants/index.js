// export const PLATFORMS = {
//     '0x1': 'ethereum',
//     '0xa': 'optimistic-ethereum',
//     '0x56': 'binance-smart-chain',
//     '0x89': 'polygon-pos',
//     '0xa86a': 'avalanche',
//     '0xfa': 'fantom',
//     '0xa4b1': 'arbitrum-one',
// };
import { CHAIN_IDS } from '@/shared/constants/chains/chainIds';

export const PLATFORMS = {
    [CHAIN_IDS.ETH]: 'ethereum',
    [CHAIN_IDS.OPTIMISM]: 'optimistic-ethereum',
    [CHAIN_IDS.BSC]: 'binance-smart-chain',
    [CHAIN_IDS.POLYGON]: 'polygon-pos',
    [CHAIN_IDS.FANTOM]: 'fantom',
    [CHAIN_IDS.AVALANCHE]: 'avalanche',
    [CHAIN_IDS.ARBITRUM]: 'arbitrum-one',
};
