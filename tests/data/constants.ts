import path from 'path';
import { getTestVar, TEST_CONST } from '../envHelper';

export const EVM_NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];
export const COSMOS_NETWORKS = {
    cosmos: 'cosmos1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjq6vrmz',
    crescent: 'cre1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjyjlxw0',
    juno: 'juno1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjkg0cu7',
    mars: 'mars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnja846we',
    osmosis: 'osmo1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjgplnds',
    stargaze: 'stars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj5xm7sn',
    injective: 'inj16g4nw4a4kuqs4gwy9yan3chq65lmuhhuyajph3',
    terra2: 'terra1sjl4q093a0s6mq2082sgty3asmdjqd3ahj85yg',
};
export const MetaMaskDirPath = path.resolve(__dirname, '..', '..', 'data', `metamask-chrome-${getTestVar(TEST_CONST.MM_VERSION)}`);

export const KeplrDirPath = path.resolve(
    __dirname,
    '..',
    '..',
    'data',
    `keplr-extension-manifest-v2-v${getTestVar(TEST_CONST.KEPLR_VERSION)}}`
);

export enum DATA_QA_LOCATORS {
    SELECT_NETWORK = 'select-network',
    TOKEN_RECORD = 'token-record',
    SELECT_TOKEN = 'select-token',
    EVM_ECOSYSTEM_WALLET = 'EVM Ecosystem wallet',
    COSMOS_ECOSYSTEM_WALLET = 'Cosmos Ecosystem wallet',
    SIDEBAR_SEND = 'sidebar-item-send',
    SIDEBAR_SWAP = 'sidebar-item-swap',
    SIDEBAR_BRIDGE = 'sidebar-item-bridge',
    SIDEBAR_SUPER_SWAP = 'sidebar-item-superSwap',
    DASHBOARD = 'dashboard',
    CONTENT = 'content',
    RECORD_MODAL = 'select-record-modal',
    CONFIRM = 'confirm',
    ASSETS_PANEL = 'assets-panel',

    INPUT_ADDRESS = 'input-address',
    INPUT_AMOUNT = 'input-amount',

    SELECT_BLOCK = 'select__block',
    ITEM = 'item',
    ROUTE_INFO = 'route-info',
}
