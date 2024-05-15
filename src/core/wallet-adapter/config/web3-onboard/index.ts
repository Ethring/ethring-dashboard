import { WalletModule } from '@web3-onboard/common';

// WALLETS
import InjectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import CoinbaseWalletModule from '@web3-onboard/coinbase';
import LedgerModule from '@web3-onboard/ledger';

import appMetadata from '@/core/wallet-adapter/config/web3-onboard/meta-data';
import { chainConfig } from '@/core/wallet-adapter/config/web3-onboard/chains';

const WALLETS_ORDER = [
    ProviderLabel.MetaMask,
    ProviderLabel.Zerion,
    ProviderLabel.Trust,
    ProviderLabel.Phantom,
    ProviderLabel.Exodus,
    ProviderLabel.Rainbow,
];

const injected = InjectedModule({
    displayUnavailable: [
        // Main Wallets
        ProviderLabel.MetaMask,
        ProviderLabel.Trust,
        ProviderLabel.Phantom,
        ProviderLabel.Zerion,
        ProviderLabel.Exodus,

        // Other Wallets
        ProviderLabel.Binance,
        ProviderLabel.Rainbow,
        ProviderLabel.OKXWallet,
        ProviderLabel.XDEFI,
        ProviderLabel.Coin98Wallet,
        ProviderLabel.Rabby,
        ProviderLabel.Zeal,
        ProviderLabel.Brave,
        ProviderLabel.OneInch,
    ],

    sort: (wallets: WalletModule[]) => {
        const metaMask = wallets.find(({ label }) => label === ProviderLabel.MetaMask);
        const zerion = wallets.find(({ label }) => label === ProviderLabel.Zerion);
        const trust = wallets.find(({ label }) => label === ProviderLabel.Trust);
        const phantom = wallets.find(({ label }) => label === ProviderLabel.Phantom);
        const exodus = wallets.find(({ label }) => label === ProviderLabel.Exodus);
        const rainbow = wallets.find(({ label }) => label === ProviderLabel.Rainbow);

        return (
            [
                // add wallets in the order of walletsOrder
                metaMask,
                zerion,
                trust,
                phantom,
                exodus,
                rainbow,
                // add wallets that are not in walletsOrder
                ...wallets.filter(({ label }) => !WALLETS_ORDER.includes(label as ProviderLabel)),
            ]
                // remove undefined values
                .filter((wallet) => wallet) as WalletModule[]
        );
    },
});
const coinbaseWalletSdk = CoinbaseWalletModule();

const wallets = [injected, coinbaseWalletSdk];

if (process.env.WC_PROJECT_ID && process.env.WC_PROJECT_ID !== 'null')
    wallets.push(
        LedgerModule({
            walletConnectVersion: 2,
            projectId: process.env.WC_PROJECT_ID,
        }),
    );

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
