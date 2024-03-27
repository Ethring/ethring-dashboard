import path from 'path';
import { getTestVar, TEST_CONST } from '../envHelper';

export const EVM_NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];

export const COSMOS_WALLETS_BY_PROTOCOL_SEED = {
    cosmoshub: 'cosmos1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjq6vrmz',
    crescent: 'cre1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjyjlxw0',
    juno: 'juno1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjkg0cu7',
    mars: 'mars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnja846we',
    osmosis: 'osmo1e9dvrk7n69hsupdnf6q5d0h6k6e33lnjgplnds',
    stargaze: 'stars1e9dvrk7n69hsupdnf6q5d0h6k6e33lnj5xm7sn',
    injective: 'inj16g4nw4a4kuqs4gwy9yan3chq65lmuhhuyajph3',
    terra2: 'terra1sjl4q093a0s6mq2082sgty3asmdjqd3ahj85yg',
};

export const COSMOS_WALLETS_BY_SEED_MOCK_TX = {
    cosmoshub: 'cosmos1aascfnuh7dpup8cmyph2l0wgee9d2lchdlx00r',
    crescent: 'cre1aascfnuh7dpup8cmyph2l0wgee9d2lchfh426w',
    juno: 'juno1aascfnuh7dpup8cmyph2l0wgee9d2lchmd95gl',
    mars: 'mars1aascfnuh7dpup8cmyph2l0wgee9d2lchszlk6c',
    osmosis: 'osmo1aascfnuh7dpup8cmyph2l0wgee9d2lch9y4le3',
    stargaze: 'stars1aascfnuh7dpup8cmyph2l0wgee9d2lcher3jyj',
    injective: 'inj1gaw02t47wctyv79kw0kup5l0gd0v7erpecntp3',
    terra2: 'terra1kl6pdx384mctqz04c866f7yrw3zwtz590343kx',
};

export const COSMOS_WALLETS_BY_EMPTY_WALLET = {
    cosmoshub: 'cosmos1asutnqnxzu8pmzsfet4dla47nwpyuqujg9ews3',
    crescent: 'cre1asutnqnxzu8pmzsfet4dla47nwpyuqujvd2t9u',
    juno: 'juno1asutnqnxzu8pmzsfet4dla47nwpyuquj7h64hd',
    mars: 'mars1asutnqnxzu8pmzsfet4dla47nwpyuquj4cqh92',
    osmosis: 'osmo1asutnqnxzu8pmzsfet4dla47nwpyuqujq727xr',
    stargaze: 'stars1asutnqnxzu8pmzsfet4dla47nwpyuqujuewnmq',
    injective: 'inj1ckux2tgss25ld9s0zq98x52vuym8pyc25pxsxk',
    terra2: 'terra1tguy55gz22u6qet4pv9jrfjpx79ycg4l5g6hcw',
};

export const MetaMaskDirPath = path.resolve(process.cwd(), 'data', `metamask-chrome-${getTestVar(TEST_CONST.MM_VERSION)}`);

export const KeplrDirPath = path.resolve(process.cwd(), 'data', `keplr-extension-manifest-v2-v${getTestVar(TEST_CONST.KEPLR_VERSION)}`);

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
    CUSTOM_INPUT = 'custom-input',
    CHECKBOX = 'checkbox',

    INPUT_ADDRESS = 'input-address',
    INPUT_AMOUNT = 'input-amount',

    ITEM = 'item',
    ROUTE_INFO = 'estimate-info',
    SLIPPAGE_ICON = 'slippage-icon',
    SLIPPAGE_CUSTOM = "slippage-custom",
    SLIPPAGE_CUSTOM_INPUT = "slippage-custom-input"
}

export enum IGNORED_LOCATORS {
    HEADER = '//header',
    ASIDE = '//aside',
    SERVICE_ICON = 'div.service-icon',
}

export const MEMO_BY_KEPLR_TEST = '105371789';
