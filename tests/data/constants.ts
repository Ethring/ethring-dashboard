import path from 'path';
import { getTestVar, TEST_CONST } from '../envHelper';

export const EVM_NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];
export const COSMOS_NETWORKS = {
    cosmos: 'cosmos1manq9qh4dj76ukdkekqu73p9779qftpqg750qz',
    crescent: 'cre1manq9qh4dj76ukdkekqu73p9779qftpqvk8240',
    juno: 'juno1manq9qh4dj76ukdkekqu73p9779qftpq7vh587',
    mars: 'mars1manq9qh4dj76ukdkekqu73p9779qftpq4rdk4e',
    osmosis: 'osmo1manq9qh4dj76ukdkekqu73p9779qftpqq98lks',
    stargaze: 'stars1manq9qh4dj76ukdkekqu73p9779qftpquzrjtn',
    injective: 'inj16hkjdkf39x5t2xk9fdqywue87eg3sf9k4gdfen',
    terra2: 'terra1v3gz0s7c26c9frqeuylml0tr3a3zunfwt7fws4',
};
export const MetaMaskDirPath = path.resolve(__dirname, '..', '..', 'data', `metamask-chrome-${getTestVar(TEST_CONST.MM_VERSION)}`);
export const KeplrDirPath = path.resolve(
    __dirname,
    '..',
    '..',
    'data',
    `keplr-extension-manifest-v2-v${getTestVar(TEST_CONST.KEPLR_VERSION)}}`
);
