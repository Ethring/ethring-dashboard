import path from 'path';
import { getTestVar, TEST_CONST } from '../envHelper';

export const EVM_NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];
export const MetaMaskDirPath = path.resolve(__dirname, '..', '..', 'data', `metamask-chrome-${getTestVar(TEST_CONST.MM_VERSION)}`);
export const KeplrDirPath = path.resolve(__dirname, '..', '..', 'data', `keplr-extension-manifest-v2-v0.12.58`); //TODO params path
