import injectedModule from '@web3-onboard/injected-wallets';

// import coinbaseWalletModule from '@web3-onboard/coinbase';
import ledgerModule from '@web3-onboard/ledger';

import appMetadata from '@/Adapter/config/web3-onboard/meta-data';

const injected = injectedModule();
// const coinbaseWalletSdk = coinbaseWalletModule();
const ledger = ledgerModule({
    projectId: '475917632e4a0f8c4e28e74577035011',
});

export default {
    wallets: [
        injected,
        // coinbaseWalletSdk,
        ledger,
    ],
    connect: {
        showSidebar: false,
        disableClose: false,
        autoConnectAllPreviousWallet: true,
    },
    accountCenter: {
        desktop: {
            enabled: false,
        },
        mobile: {
            enabled: false,
        },
    },
    appMetadata,
    theme: 'light',
};
