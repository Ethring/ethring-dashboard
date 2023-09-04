import { ref } from 'vue';

import { fromEvent } from 'rxjs';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
// import { wallets as LeapWallets } from '@cosmos-kit/leap';

import { ECOSYSTEMS, cosmologyConfig } from '@/Adapter/config';

import AdapterBase from '@/Adapter/utils/AdapterBase';

import { reEncodeWithNewPrefix } from '@/Adapter/utils';

// import { cosmos } from 'juno-network';

const DEFAULT_CHAIN = 'cosmoshub';

const [KEPLR_EXT] = KeplrWallets;

const STORAGE = {
    WALLET: 'cosmos-kit@2:core//current-wallet',
    ACCOUNTS: 'cosmos-kit@2:core//accounts',
};

const REFRESH_EVENT = 'refresh_connection';

const connectedAccounts = () => JSON.parse(window?.localStorage?.getItem(STORAGE.ACCOUNTS)) || [];
const connectedWalletModule = () => window?.localStorage.getItem(STORAGE.WALLET) || null;

class CosmosAdapter extends AdapterBase {
    constructor() {
        super();
        const { chains, assets } = cosmologyConfig;
        const logger = new Logger('INFO');
        this.walletManager = new WalletManager(chains, assets, [KEPLR_EXT], logger);
        this.walletManager.onMounted();
    }

    getConnectedWallets() {
        for (const wallet of connectedAccounts()) {
            wallet.ecosystem = ECOSYSTEMS.COSMOS;
            delete wallet.namespace;
        }

        return connectedAccounts();
    }

    subscribeToWalletsChange() {
        const walletModule = this._getCurrentWallet();

        if (!walletModule?.value) {
            return;
        }

        const listeners = this.walletManager.coreEmitter.listeners(REFRESH_EVENT);

        if (listeners.length > 0) {
            return;
        }

        return fromEvent(this.walletManager, REFRESH_EVENT, async () => {
            const chainWallet = this._getCurrentWallet();
            chainWallet?.value?.activate();

            await chainWallet?.value?.connect(false);
            await chainWallet?.value?.update({ connect: false });

            await this.setAddressForChains();
        });
    }

    async updateStates() {
        const chainWallet = this._getCurrentWallet();
        await chainWallet?.value?.update({ connect: false });
    }

    _getCurrentWallet() {
        const accounts = connectedAccounts();

        const wallet = this.walletName || connectedWalletModule();

        if (!wallet || !accounts.length) {
            return null;
        }

        const [account] = accounts;

        const chainRecord = this.walletManager.chainRecords.find(({ chain }) => chain.chain_id === account.chainId);

        if (!chainRecord) {
            return null;
        }

        const chainWallet = ref(this.walletManager.getChainWallet(chainRecord.name, wallet));

        chainWallet.value?.emitter && chainWallet.value.emitter.setMaxListeners(1000);

        return chainWallet;
    }

    async connectWallet(walletName, chain = DEFAULT_CHAIN) {
        try {
            this.walletName = walletName;

            const chainWallet = this.walletManager.getChainWallet(chain, walletName);

            chainWallet.activate();
            await chainWallet.initClient();
            await chainWallet.connect(true);

            const isConnected = chainWallet.isWalletConnected;

            if (isConnected) {
                await this.setAddressForChains();
                await chainWallet.update({ connect: true });
            }

            return isConnected;
        } catch (error) {
            console.error(error, this.walletManager.isError);
            return false;
        }
    }

    async setChain(chainInfo) {
        const { walletName, chain } = chainInfo;
        return await this.connectWallet(walletName, chain);
    }

    async setAddressForChains() {
        if (!this.addressByNetwork) {
            this.addressByNetwork = {};
        }

        const mainAddress = this.getAccountAddress();

        if (!mainAddress) {
            return null;
        }

        for (const { chain } of this.walletManager.chainRecords) {
            const { bech32_prefix, chain_name } = chain;
            const chainAddress = await reEncodeWithNewPrefix(bech32_prefix, mainAddress);
            this.addressByNetwork[chain_name] = chainAddress;
        }
    }

    getMainWallets() {
        return this.walletManager.mainWallets || [];
    }

    async disconnectWallet(wallet) {
        const walletModule = this.walletManager.getMainWallet(wallet);
        await walletModule?.value?.disconnect(true);
        await walletModule?.value?.update({ connect: false });

        window.localStorage.removeItem(STORAGE.WALLET);
        window.localStorage.removeItem(STORAGE.ACCOUNTS);
        this.addressByNetwork = {};
    }

    async disconnectAllWallets() {
        const walletModule = this._getCurrentWallet();
        await walletModule?.value?.disconnect(true);
        await walletModule?.value?.update({ connect: false });

        window.localStorage.removeItem(STORAGE.WALLET);
        window.localStorage.removeItem(STORAGE.ACCOUNTS);
        this.addressByNetwork = {};
    }

    getWalletModule() {
        return connectedWalletModule() || null;
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
        const chainList = this.walletManager.chainRecords.map((record) => {
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
        const module = this.walletManager.mainWallets.find((wallet) => wallet.walletName === walletModule);
        return module?.walletInfo?.logo || null;
    }

    getAddressesWithChains() {
        return this.addressByNetwork || {};
    }
}

export default new CosmosAdapter();
