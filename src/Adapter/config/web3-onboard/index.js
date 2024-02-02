import injectedModule from '@web3-onboard/injected-wallets';

import coinbaseWalletModule from '@web3-onboard/coinbase';
// import ledgerModule from '@web3-onboard/ledger';

import appMetadata from '@/Adapter/config/web3-onboard/meta-data';
import { chainConfig } from '@/Adapter/config/web3-onboard/chains';

const injected = injectedModule();
const coinbaseWalletSdk = coinbaseWalletModule();

const wallets = [injected, coinbaseWalletSdk];

// if (import.meta.env.VITE_WC_PROJECT_ID && import.meta.env.VITE_WC_PROJECT_ID !== 'null') {
//     const ledger = ledgerModule({
//         projectId: import.meta.env.VITE_WC_PROJECT_ID,
//     });

//     wallets.push(ledger);
// }

export default {
    wallets,
    connect: {
        showSidebar: false,
        disableClose: false,
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
    chains: chainConfig,
};
