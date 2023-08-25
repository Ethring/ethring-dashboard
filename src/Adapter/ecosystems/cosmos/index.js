/* eslint-disable no-unused-vars */

import { ref, computed } from 'vue';

import { fromEvent } from 'rxjs';

import { chains, assets } from 'chain-registry';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
import { wallets as LeapWallets } from '@cosmos-kit/leap';

import { ECOSYSTEMS } from '@/Adapter/config';

import AdapterBase from '@/Adapter/utils/AdapterBase';

import { reEncodeWithNewPrefix } from '@/Adapter/utils';

// import { cosmos } from 'juno-network';

const NET_TYPE = 'mainnet';
const NET_STATUS = 'live';
const EXPLORER_KIND = 'mintscan';
const DEFAULT_CHAIN = 'cosmoshub';

const [KEPLR_EXT, KEPLR_MOB] = KeplrWallets;
const [LEAP_EXT, LEAP_MOB] = LeapWallets;

const ACTIVE_CHAINS = chains.filter(
    (chain) =>
        chain.network_type === NET_TYPE &&
        chain.status === NET_STATUS &&
        chain.explorers.find((explorer) => explorer.kind === EXPLORER_KIND) &&
        chain.staking &&
        chain.chain_id
);

const walletManager = new WalletManager(ACTIVE_CHAINS, assets, [KEPLR_EXT], new Logger());

const STORAGE = {
    WALLET: 'cosmos-kit@2:core//current-wallet',
    ACCOUNTS: 'cosmos-kit@2:core//accounts',
};

class CosmosAdapter extends AdapterBase {
    _chainWithAddress = {};

    constructor() {
        super();
        walletManager.onMounted();
    }

    getConnectedWallets() {
        const accounts = window.localStorage.getItem(STORAGE.ACCOUNTS);
        const wallets = JSON.parse(accounts);

        return wallets;
    }

    subscribeToWalletsChange() {
        const walletModule = this._getCurrentWallet();

        if (!walletModule?.value) {
            return;
        }

        return fromEvent(walletManager, 'refresh_connection', async () => {
            const chainWallet = this._getCurrentWallet();
            chainWallet?.value?.activate();
            chainWallet?.value?.connect(false);
            chainWallet?.value?.update({ connect: false });
            this._chainWithAddress = {};
            await this.getChainAddrFromAddress();
        });
    }

    async updateStates() {
        const chainWallet = this._getCurrentWallet();
        await chainWallet?.value?.update({ connect: false });
    }

    _getCurrentWallet() {
        const accountStr = window.localStorage.getItem(STORAGE.ACCOUNTS);
        const wallet = this._walletModule || window.localStorage.getItem(STORAGE.WALLET);

        if (!accountStr || accountStr === '[]' || !wallet) {
            return null;
        }

        const [account] = JSON.parse(accountStr);

        const chainRecord = walletManager.chainRecords.find((record) => record.chain.chain_id === account.chainId);

        if (!chainRecord) {
            return null;
        }

        const chainWallet = ref(walletManager.getChainWallet(chainRecord.name, wallet));

        if (chainWallet.value?.emitter) {
            chainWallet.value.emitter.setMaxListeners(1000);
        }

        return chainWallet;
    }

    async connectWallet(walletName, chain = DEFAULT_CHAIN) {
        try {
            walletManager.getChainWallet(chain, walletName).activate();
            await walletManager.getChainWallet(chain, walletName).initClient();

            await walletManager.getChainWallet(chain, walletName).connect(true);

            await this.getChainAddrFromAddress();

            return walletManager.getChainWallet(chain, walletName).isWalletConnected;
        } catch (error) {
            console.log(error, walletManager.isError);
            return false;
        }
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
    }

    setChainWithAddress(chain, address) {
        this._chainWithAddress[chain] = address;
    }

    getMainWallets() {
        return walletManager.mainWallets || [];
    }

    async disconnectWallet() {}

    async disconnectAllWallets() {
        const walletModule = this._getCurrentWallet();
        await walletModule?.value?.disconnect(true);
        await walletModule?.value?.update({ connect: false });
        window.localStorage.removeItem(STORAGE.WALLET);
        window.localStorage.removeItem(STORAGE.ACCOUNTS);
    }

    getWalletModule() {
        const walletModule = window.localStorage.getItem(STORAGE.WALLET);
        return walletModule || null;
    }

    getAccount() {
        const walletModule = this._getCurrentWallet();
        return walletModule?.value?.username || null;
    }

    getAccountAddress() {
        const walletModule = this._getCurrentWallet();
        return walletModule?.value?.address || null;
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
        const walletModule = this._getCurrentWallet();

        const chainInfo = walletModule?.value?.chain;
        const walletInfo = walletModule?.value?.walletInfo;

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

    getChainWithAddresses() {
        return this._chainWithAddress;
    }
}

export default new CosmosAdapter();
