/* eslint-disable no-unused-vars */
import WalletInterface from '@/Adapter/utils/WalletInterface';
import { ECOSYSTEMS } from '@/Adapter/config';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { chains, assets, ibc } from 'chain-registry';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
import { wallets as LeapWallets } from '@cosmos-kit/leap';

// import { cosmos } from 'juno-network';

const [KeplrExtension, KeplrMobile] = KeplrWallets;
const [LeapExtension, LeapMobile] = LeapWallets;

const logger = new Logger();
const cosmology = new WalletManager(chains, assets, [KeplrExtension, LeapExtension], logger);

class CosmosAdapter extends WalletInterface {
    currentWallet = null;

    constructor() {
        super();
    }

    async connectWallet(walletName, chain = 'cosmoshub') {
        const repo = cosmology.getWalletRepo(chain);
        const currentWallet = repo.getWallet(walletName);
        await currentWallet.initClient();
        await currentWallet.connect(true);

        this.currentWallet = currentWallet;

        return currentWallet.isDone;
    }

    getMainWallets() {
        return cosmology.mainWallets || [];
    }

    async disconnectWallet() {}

    async disconnectAllWallets() {
        await this.currentWallet?.disconnect(true);
        this.currentWallet = null;
    }

    getAccount() {
        return this.currentWallet?.address || null;
    }

    getCurrentChain() {
        const chainInfo = this.currentWallet?.chain;
        const walletInfo = this.currentWallet?.walletInfo;

        if (!chainInfo || !walletInfo) {
            return null;
        }

        return {
            ...chainInfo,
            walletName: walletInfo.name,
            walletPrettyName: walletInfo.prettyName,
            net: chainInfo.chain_id,
            chain_id: chainInfo.chain_name,
            ecosystem: ECOSYSTEMS.COSMOS,
            logo: chainInfo.logo_URIs?.png || chainInfo.logo_URIs?.svg || null,
        };
    }

    getChainList() {}

    getWalletLogo() {
        return this.currentWallet?.walletInfo?.logo || null;
    }
}

export default new CosmosAdapter();
