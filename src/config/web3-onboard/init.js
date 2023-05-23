// import * as ethers from 'ethers';

import { init } from '@web3-onboard/vue';

import injectedModule from '@web3-onboard/injected-wallets';
import coinbaseWalletModule from '@web3-onboard/coinbase';

import { chains, appMetadata } from '@/config/web3-onboard';

import ledgerModule from '@web3-onboard/ledger';

const injected = injectedModule();

const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true });

const ledger = ledgerModule();

console.log('web3-onboard', '================================', 'initializing');

export default init({
    wallets: [injected, coinbaseWalletSdk, ledger],
    connect: {
        showSidebar: true,
        disableClose: true,
        autoConnectAllPreviousWallet: true,
    },
    chains,
    appMetadata,
    theme: 'light',
});

console.log('web3-onboard', '================================', 'initialized');
