// import * as ethers from 'ethers';

import { init } from '@web3-onboard/vue';

import injectedModule from '@web3-onboard/injected-wallets';
import coinbaseWalletModule from '@web3-onboard/coinbase';

import appMetadata from '@/config/web3-onboard/meta-data';

import ledgerModule from '@web3-onboard/ledger';

const injected = injectedModule();

const coinbaseWalletSdk = coinbaseWalletModule();

const ledger = ledgerModule();

import defaultChains from '@/api/networks/default-chains';

const initWeb3 = (chains = defaultChains) =>
    init({
        wallets: [injected, coinbaseWalletSdk, ledger],
        connect: {
            showSidebar: true,
            disableClose: false,
            autoConnectAllPreviousWallet: true,
        },
        chains,
        appMetadata,
        theme: 'light',
    });

export default initWeb3;
