import path from 'path';
import { getTestVar, TEST_CONST } from '../envHelper';

export const EVM_NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];
export const COSMOS_NETWORKS = ['cosmos', 'stargaze', 'juno', 'osmosis', 'mars', 'injective', 'terr2', 'crescent'];
export const COSMOS_ADDRESSES = { 'cosmos': 'cosmos1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjq6vrmz', 'crescent': 'cre1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjyjlxw0', 'injective': 'inj16g4nw4a4kuqs4gwy9yan3chq65lmuhhuyajph3', 'juno': 'juno1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjkg0cu7', 'mars': 'mars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnja846we', 'osmosis': 'osmo1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjgplnds', 'stargaze': 'stars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj5xm7sn', 'terra2': 'terra1sjl4q093a0s6mq2082sgty3asmdjqd3ahj85yg' }

export const MetaMaskDirPath = path.resolve(__dirname, '..', '..', 'data', `metamask-chrome-${getTestVar(TEST_CONST.MM_VERSION)}`);
export const KeplrDirPath = path.resolve(
    __dirname,
    '..',
    '..',
    'data',
    `keplr-extension-manifest-v2-v${getTestVar(TEST_CONST.KEPLR_VERSION)}}`
);
