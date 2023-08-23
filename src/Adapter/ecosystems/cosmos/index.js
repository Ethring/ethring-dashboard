/* eslint-disable no-unused-vars */
import { fromEvent } from 'rxjs';
import { chains, assets, ibc } from 'chain-registry';
import { Logger, WalletManager } from '@cosmos-kit/core';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
import { wallets as LeapWallets } from '@cosmos-kit/leap';

import { ECOSYSTEMS } from '@/Adapter/config';

import WalletInterface from '@/Adapter/utils/WalletInterface';

import { reEncodeWithNewPrefix } from '@/Adapter/utils';

// import { cosmos } from 'juno-network';

const EXPLORER_KIND = 'mintscan';
const DEFAULT_CHAIN = 'cosmoshub';

const [KeplrExtension, KeplrMobile] = KeplrWallets;
const [LeapExtension, LeapMobile] = LeapWallets;

const ENABLE_ALL_ACTIVE = [KeplrExtension.walletName];

const ACTIVE_CHAINS = chains.filter(
    (chain) =>
        chain.network_type === 'mainnet' &&
        chain.status === 'live' &&
        chain.chain_id &&
        chain.explorers.find((explorer) => explorer.kind === EXPLORER_KIND) &&
        chain.staking
);

const logger = new Logger();
const walletManager = new WalletManager(ACTIVE_CHAINS, assets, [KeplrExtension, LeapExtension], logger);

class CosmosAdapter extends WalletInterface {
    _walletStorage = 'cosmos-kit@2:core//current-wallet';
    _accountsStorage = 'cosmos-kit@2:core//accounts';

    _chainWallet = null;

    _chainWithAddress = {};

    constructor() {
        super();
        walletManager.onMounted();
    }

    subscribeToWalletsChange() {
        return fromEvent(walletManager, 'refresh_connection');
    }

    setChainWallet(chainWallet) {
        this._chainWallet = chainWallet;
    }

    async connectWallet(walletName, chain = DEFAULT_CHAIN) {
        await walletManager.onMounted();

        walletManager.getChainWallet(chain, walletName).activate();
        await walletManager.getChainWallet(chain, walletName).initClient();
        await walletManager.getChainWallet(chain, walletName).connect(true);

        this.setChainWallet(walletManager.getChainWallet(chain, walletName));

        walletManager.on('refresh_connection', () => {
            console.log('refresh_connection', '\n\n\n');
            console.log('currentWallet', this.currentWallet);

            if (this.currentWallet) {
                this.setChainWallet(walletManager.getChainWallet(DEFAULT_CHAIN, this.currentWallet));
            }
        });

        await this.getChainAddrFromAddress();
        return this._chainWallet.isDone;
    }

    async setChain(chainInfo) {
        const { walletName, chain } = chainInfo;
        return await this.connectWallet(walletName, chain);
    }

    async getChainAddrFromAddress() {
        const mainAddress = this.getAccountAddress();

        if (!mainAddress) {
            return;
        }

        const promises = walletManager.chainRecords.map(({ chain }) => {
            const { bech32_prefix } = chain;
            const chainAddress = reEncodeWithNewPrefix(bech32_prefix, mainAddress);
            return this.setChainWithAddress(chain.chain_name, chainAddress);
        });

        await Promise.all(promises);
        console.log('addresses in other chains', this._chainWithAddress);
    }

    setChainWithAddress(chain, address) {
        this._chainWithAddress[chain] = address;
    }

    getMainWallets() {
        return walletManager.mainWallets || [];
    }

    async disconnectWallet() {}

    async disconnectAllWallets() {
        await this._chainWallet?.disconnect(true);
        this._chainWallet = null;
    }

    getWalletModule() {
        const walletModule = window.localStorage.getItem(this._walletStorage);
        return walletModule || null;
    }

    getAccount() {
        return this._chainWallet?.username || null;
    }

    getAccountAddress() {
        return this._chainWallet?.address || null;
    }

    getConnectedWallet() {
        const connectedWallet = {
            account: this.getAccount(),
            address: this.getAccountAddress(),
            walletModule: this.getWalletModule(),
            ecosystem: ECOSYSTEMS.COSMOS,
        };

        return connectedWallet || null;
    }

    getCurrentChain() {
        const chainInfo = this._chainWallet?.chain;
        const walletInfo = this._chainWallet?.walletInfo;

        if (!chainInfo || !walletInfo) {
            return null;
        }

        const currentChain = {
            walletName: walletInfo.name,
            walletPrettyName: walletInfo.prettyName,
            net: chainInfo.chain_id,
            chain_id: chainInfo.chain_name,
            ecosystem: ECOSYSTEMS.COSMOS,
            logo: chainInfo.logo_URIs?.png || chainInfo.logo_URIs?.svg || null,
        };

        return currentChain;
    }

    getChainList() {
        const chainList = walletManager.chainRecords.map((record) => {
            const { chain } = record;
            const chainRecord = {
                chain_id: chain.chain_name,
                name: chain.pretty_name,
                logo: chain.logo_URIs?.png || chain.logo_URIs?.svg || null,
            };
            return chainRecord;
        });

        return chainList;
    }

    getWalletLogo(walletModule) {
        const module = walletManager.mainWallets.find((wallet) => wallet.walletName === walletModule);
        return module?.walletInfo?.logo || null;
    }
}

export default new CosmosAdapter();
