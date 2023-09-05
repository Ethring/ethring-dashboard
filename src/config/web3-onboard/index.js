import injectedModule from '@web3-onboard/injected-wallets';

import coinbaseWalletModule from '@web3-onboard/coinbase';
// import ledgerModule from '@web3-onboard/ledger';

import appMetadata from '@/config/web3-onboard/meta-data';

// Wallet modules for the connection;
const injected = injectedModule();
const coinbaseWalletSdk = coinbaseWalletModule();
// const ledger = ledgerModule();

export default {
    wallets: [injected, coinbaseWalletSdk],
    connect: {
        showSidebar: true,
        disableClose: false,
        autoConnectAllPreviousWallet: true,
    },
    appMetadata,
    theme: 'light',
};
