import { Store } from 'vuex';
import * as ethers from 'ethers';
import { orderBy } from 'lodash';
import { useLocalStorage } from '@vueuse/core';

// * Web3-onboard (Blocknative)
import { InitOptions, ConnectOptions, OnboardAPI } from '@web3-onboard/core';
import { init, useOnboard } from '@web3-onboard/vue';
import { providers, utils } from 'ethers';

// * Types
import { IEthereumAdapter, IAddressByNetwork, IChainInfo } from '@/core/wallet-adapter/models/ecosystem-adapter';
import { IConnectedWallet } from '@/shared/models/types/Account';

// * Configs
import {
    BASE_ABI,
    SILO_EXECUTE_ABI,
    BEEFY_DEPOSIT_ABI,
    EXTRA_FI_ABI,
    COMPOUND_ABI,
    BERACHAIN_ABI,
    MITOSIS_ABI,
    web3OnBoardConfig,
} from '@/core/wallet-adapter/config';
import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

// * Utils
import Logger from '@/shared/logger';
import { errorRegister } from '@/shared/utils/errors';
import { validateEthAddress } from '@/core/wallet-adapter/utils/validations';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { getBlocknativeConfig } from '@/modules/chain-configs/api';
import { isDefaultChain } from '@/core/wallet-adapter/utils';

import SocketDataProvider from '@/core/balance-provider/socket';

// *****************************************************************
// * Constants
// *****************************************************************

/**
 * ABI JSON by key name
 * @type {Object}
 * @constant
 */
const ABI_BY_NAME: { [key: string]: any } = {
    DEFAULT: BASE_ABI,
    SILO_EXECUTOR: SILO_EXECUTE_ABI,
    BEEFY_DEPOSIT: BEEFY_DEPOSIT_ABI,
    EXTRA_FI: EXTRA_FI_ABI,
    COMPOUND: COMPOUND_ABI,
    BERACHAIN: BERACHAIN_ABI,
    MITOSIS: MITOSIS_ABI,
};

/**
 * Local storage keys
 * @type {Object}
 * @constant
 */
const STORAGE: { [key: string]: string } = {
    WALLET: 'onboard.js:last_connected_wallet',
    CONNECTED_WALLETS_KEY: 'adapter:connectedWallets',
};

const connectedWalletsStorage = useLocalStorage(STORAGE.CONNECTED_WALLETS_KEY, [], { mergeDefaults: true });

// *****************************************************************
// * Adapter implementation
// *****************************************************************

/**
 * Represents the Ethereum adapter for interacting with the Ethereum ecosystem.
 * @implements {IEthereumAdapter}
 * @class EthereumAdapter
 * @singleton EthereumAdapter
 * @classdesc Adapter for interacting with the Ethereum ecosystem.
 * @export default EthereumAdapter - The Ethereum adapter class.
 */

export class EthereumAdapter implements IEthereumAdapter {
    // * Singleton instance
    private static instance: EthereumAdapter | null = null;

    // ****************************************************
    // * Adapter properties
    // ****************************************************
    walletName: string | null = null;
    walletManager: OnboardAPI | any;
    addressByNetwork: IAddressByNetwork = {};
    DEFAULT_CHAIN: string = 'eth';
    initialized: boolean = false;

    private constructor() {
        this.walletManager = null;
        this.addressByNetwork = {};
    }

    public static getInstance(): EthereumAdapter {
        if (!EthereumAdapter.instance) EthereumAdapter.instance = new EthereumAdapter();

        return EthereumAdapter.instance;
    }

    // ****************************************************
    // * Public methods
    // ****************************************************

    async init(store: Store<any>): Promise<void> {
        if (this.initialized) return;
        const initOptions = web3OnBoardConfig as InitOptions;
        initOptions.chains = await getBlocknativeConfig();
        this.walletManager = init(initOptions);
        this.walletManager.state.select('wallets').subscribe((wallet: any) => {
            if (!wallet?.length && this.walletName) this.connectWallet(this.walletName, { store });
            this.setAddressForChains({ store });
        });
        this.initialized = true;
    }

    isLocked(): boolean {
        return !this.getAccountAddress();
    }

    // ****************************************************
    // * Wallet Subscription
    // ****************************************************

    subscribeToWalletsChange() {
        return this.walletManager.state.select('wallets');
    }

    unsubscribeFromWalletsChange(walletsSubscription: any) {
        console.log('Unsubscribe from wallets change', 'ethereum');
        return walletsSubscription?.unsubscribe();
    }

    // ****************************************************
    // * Wallet Connection & Disconnection
    // ****************************************************

    async connectWallet(
        walletName: string | null,
        { store }: { store: Store<any> },
    ): Promise<{ isConnected: boolean; walletName: string | null }> {
        const { connectWallet, connectedWallet } = useOnboard();

        let connectionOption: ConnectOptions | undefined = undefined;

        if (walletName) {
            connectionOption = {
                autoSelect: {
                    label: walletName,
                    disableModals: true,
                },
            };

            this.walletName = walletName;
        }

        try {
            await connectWallet(connectionOption);
            const { wallets = [] } = this.walletManager.state.get() || {};

            if (wallets.length) this.setAddressForChains({ store: store });

            return {
                isConnected: !!wallets.length,
                walletName: connectedWallet.value?.label || null,
            };
        } catch (error) {
            console.error('Failed to connect to:', walletName, error);
            return {
                isConnected: false,
                walletName: null,
            };
        } finally {
            store = null as any;
        }
    }

    async disconnectWallet(label: string) {
        const { disconnectWallet } = useOnboard();

        try {
            Logger.info('Disconnecting wallet:', label);
            if (label === this.walletName) this.walletName = null;
            await disconnectWallet({ label });
            this.addressByNetwork = {};
        } catch (error) {
            console.error(`Error while disconnect from ${label}`, error);
        }
    }

    async disconnectAllWallets() {
        const { alreadyConnectedWallets } = useOnboard();

        try {
            console.log('Disconnecting all wallets', alreadyConnectedWallets.value);
            await Promise.all(alreadyConnectedWallets.value.map((wallet: any) => this.disconnectWallet(wallet)));
            this.addressByNetwork = {};
            // * Disconnect wallets from store
            await this.disconnectAllWalletsFromStore();
        } catch (error) {
            console.error('Error while disconnect all wallets', error);
        }
    }

    async disconnectAllWalletsFromStore() {
        const { disconnectWallet } = useOnboard();

        const walletsFromStore = window.localStorage.getItem(STORAGE.WALLET) || null;
        const wallets = walletsFromStore ? JSON.parse(walletsFromStore) : [];

        if (!wallets.length) return;

        try {
            for (const wallet of wallets) await disconnectWallet({ label: wallet });
        } catch (error) {
            console.error('Error while disconnect wallets from store', error);
        }
    }

    // ****************************************************
    // * Wallet Address & Chain Info
    // ****************************************************

    setAddressForChains({ store }: { store: Store<any> }) {
        if (!this.addressByNetwork) this.addressByNetwork = {};

        const { chains } = this.walletManager.state.get();
        const mainAddress = this.getAccountAddress();

        if (!mainAddress) return;

        for (const { id } of chains) {
            if (!id) continue;
            const chainInfo = store.getters['configs/getChainConfigByChainId'](id, Ecosystem.EVM) || {};

            // ! Skip if chain info is not available
            if (!chainInfo) continue;

            const { net, logo, native_token } = chainInfo || {};

            if (!this.addressByNetwork[net]) this.addressByNetwork[net] = null;

            this.addressByNetwork[net] = {
                address: mainAddress,
                logo,
                nativeTokenLogo: native_token?.logo,
            };
        }

        store = null as any;
    }

    getDefaultWalletAddress(): string | null {
        const chainWithAddress = this.addressByNetwork[this.DEFAULT_CHAIN];

        if (!chainWithAddress) return null;

        return chainWithAddress.address;
    }

    async getRealAddress(): Promise<string | undefined> {
        const address = this.getAccountAddress();

        try {
            const provider = this.getProvider();
            return provider?._getAddress(address as string);
        } catch (error) {
            console.error('Failed to get real address', error);
            return address || undefined;
        }
    }

    async getAddressesWithChains(store: Store<any>): Promise<IAddressByNetwork> {
        this.setAddressForChains({ store });
        return this.addressByNetwork || {};
    }

    // ****************************************************
    // * Wallet Info methods
    // ****************************************************

    getMainWallets(): any[] {
        return [];
    }

    getWalletModule(): string | null {
        const { connectedWallet } = useOnboard();
        const { label = null } = connectedWallet.value || {};
        return label;
    }

    updateIcon(index: number, icon: string, store: Store<any>) {
        if (index === -1) return;

        const connectedWallet: IConnectedWallet = connectedWalletsStorage.value[index];

        if (!connectedWallet) return;

        connectedWallet.icon = icon;

        store.dispatch('adapters/SET_WALLET', { ecosystem: Ecosystem.EVM, wallet: connectedWallet });
    }

    getWalletIconFromStore(walletModule: string | null, store: Store<any>): string | null {
        const index = connectedWalletsStorage.value.findIndex((wallet: IConnectedWallet) => wallet.walletModule === walletModule);
        if (index === -1) return null;

        const wallet: IConnectedWallet = connectedWalletsStorage.value[index];
        if (!wallet) return null;

        this.updateIcon(index, wallet.icon, store);

        return wallet.icon;
    }

    async getWalletLogoFromOnboard(walletModule: string | null, store: Store<any>): Promise<string | null> {
        const { walletModules } = this.walletManager.state.get() || {};
        const exist = walletModules.find((module: any) => module.label === walletModule);

        if (!exist) return null;

        const index = connectedWalletsStorage.value.findIndex((wallet: IConnectedWallet) => wallet.walletModule === walletModule);

        try {
            const icon = await exist.getIcon();

            this.updateIcon(index, icon, store);

            return icon;
        } catch (error) {
            console.error('Failed to get icon for', walletModule, error);
            return null;
        }
    }

    async getWalletLogo(walletModule: string | null, store: any): Promise<string | null> {
        if (!walletModule) return null;

        if (this.getWalletIconFromStore(walletModule, store)) return this.getWalletIconFromStore(walletModule, store);

        return await this.getWalletLogoFromOnboard(walletModule, store);
    }

    // ****************************************************
    // * Wallet Address & Account & Chain methods
    // ****************************************************

    getAccount(): string | null {
        return this.getAccountAddress();
    }

    getAccountAddress(): string | null {
        const { connectedWallet } = useOnboard();

        if (!connectedWallet.value) return null;

        const { accounts = [] } = connectedWallet.value || {};
        const [primaryAccount] = accounts || [];
        const { address } = primaryAccount || {};

        return address || null;
    }

    getCurrentChain(store: Store<any>): IChainConfig | null {
        const { connectedWallet, connectedChain } = useOnboard();
        const { label = null } = connectedWallet.value || {};

        const { id = null } = connectedChain.value || {};

        if (!id || (id && isNaN(+id))) return null;

        if (!store) return null;

        const chainInfo = store.getters['configs/getChainConfigByChainId'](id, Ecosystem.EVM) || {};

        if (JSON.stringify(chainInfo) === '{}') chainInfo.chain_id = id;

        chainInfo.walletName = chainInfo.walletModule = label;
        chainInfo.ecosystem = Ecosystem.EVM;

        return chainInfo;
    }

    getConnectedWallet(): IConnectedWallet | null {
        if (!this.getAccount()) return null;

        return {
            account: this.getAccount(),
            address: this.getAccountAddress(),
            walletModule: this.getWalletModule(),
            ecosystem: Ecosystem.EVM,
        } as IConnectedWallet;
    }

    // ****************************************************
    // * Wallet chain methods
    // ****************************************************

    getNativeTokenByChain(chain: string, store: any): any {
        const isLoadingConfig = store.getters['configs/isConfigLoading'];

        if (isLoadingConfig)
            return setTimeout(() => {
                return this.getNativeTokenByChain(chain, store);
            }, 1000);

        const chainsInfo = store.getters['configs/getConfigsByEcosystems'](Ecosystem.EVM);

        return chainsInfo.evm[chain] || null;
    }

    getChainList({ allChains = false, store }: { allChains?: boolean; store: Store<any> }): IChainConfig[] {
        if (!store) return [];
        if (!store.getters['configs/getConfigsListByEcosystem']) return [];

        const chains = store.getters['configs/getConfigsListByEcosystem'](Ecosystem.EVM) || [];

        if (!chains.length) return [];

        const chainList = chains.map((chain: any) => {
            chain.walletName = chain.walletModule = this.getWalletModule();
            chain.ecosystem = Ecosystem.EVM;
            chain.isSupportedChain = isDefaultChain(chain);
            return chain;
        });

        if (!allChains) return chainList.filter(isDefaultChain);

        return orderBy(chainList, [(elem) => elem.isSupportedChain], ['desc']);
    }

    async setChain(chainInfo: IChainInfo): Promise<boolean> {
        const { chain_id, chain } = chainInfo || {};

        const id = chain_id || chain;

        if (!id) return false;

        try {
            return await this.walletManager.setChain({ chainId: id });
        } catch (error) {
            console.log('Failed to set chain', error);
            return false;
        }
    }

    // ****************************************************
    // * Transaction methods
    // ****************************************************

    getProvider(): providers.Web3Provider | null {
        const { connectedWallet } = useOnboard();

        const { provider } = connectedWallet.value || {};

        if (!provider) return null;

        try {
            const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
            return ethersProvider;
        } catch (error) {
            console.error('Failed to get provider', error);
            return null;
        }
    }

    async formatTransactionForSign(transaction: any): Promise<any> {
        if (typeof transaction.chainId === 'number') transaction.chainId = `0x${transaction.chainId.toString(16)}`;

        if (typeof transaction.gasPrice === 'string') transaction.gasPrice = `0x${parseInt(transaction.gasPrice).toString(16)}`;

        if (typeof transaction.nonce === 'number' || !transaction.nonce) {
            const ethersProvider = this.getProvider();
            if (ethersProvider) transaction.nonce = await ethersProvider.getTransactionCount(transaction.from);
        }

        if (['number', 'string'].includes(typeof transaction.gas)) {
            transaction.gasLimit = `0x${parseInt(transaction.gas).toString(16)}`; // TODO: Check if it's necessary
            delete transaction.gas;
        }

        transaction.value = transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0';

        if (!transaction?.data?.startsWith('0x')) transaction.data = `0x${transaction.data}`;

        return transaction;
    }

    async prepareTransaction({ fromAddress, toAddress, amount, token }: any): Promise<any> {
        const ethersProvider = this.getProvider();

        if (!ethersProvider) throw new Error('EVM provider is not available');

        try {
            const value = !token?.address ? utils.parseEther(amount) : utils.parseUnits('0');

            const nonce = await ethersProvider.getTransactionCount(fromAddress);

            const contractAddress = token?.address;

            const response = {
                from: fromAddress,
                to: toAddress,
                value,
                nonce,
            };

            if (!contractAddress) return response;

            const res = await this.callContractMethod({
                contractAddress,
                method: 'transfer',
                args: [toAddress, utils.parseUnits(amount, token.decimals)],
            });

            return {
                ...response,
                ...res,
            };
        } catch (e) {
            return errorRegister(e);
        }
    }

    async callContractMethod({
        contractAddress,
        method,
        args,
        abi,
        value,
        type = 'WRITE',
    }: {
        contractAddress: string;
        method: string;
        args: any[];
        abi?: string;
        value?: string;
        type?: string;
    }): Promise<any> {
        const ethersProvider = this.getProvider();

        let ABI = ABI_BY_NAME.DEFAULT;

        if (abi && ABI_BY_NAME[abi]) ABI = ABI_BY_NAME[abi];

        if (!ethersProvider) throw new Error('EVM provider is not available');

        try {
            let argsToCall = args;

            if (abi === 'SILO_EXECUTOR' && method === 'execute') argsToCall = [[args]];

            const signer = ethersProvider.getSigner();

            const contract = new ethers.Contract(contractAddress, ABI, ethersProvider as any);
            contract.connect(signer as any);

            const response = {
                chainId: (await ethersProvider.getNetwork()).chainId,
                from: await signer.getAddress(),
                to: contractAddress,
            } as any;

            if (type === 'READ') return await contract.callStatic[method](...argsToCall);

            const populatedTransaction = await contract.populateTransaction[method](...argsToCall);

            response.data = populatedTransaction.data;
            if (value) response.value = value;

            const formattedResponse = await this.formatTransactionForSign(response);

            return formattedResponse;
        } catch (e) {
            console.error('Error while calling contract method:', e);
            throw e;
        }
    }

    // ****************************************************
    // * Transaction signing methods
    // ****************************************************

    async signSend(transaction: any, { store }: { store: Store<any> }): Promise<any> {
        const ethersProvider = this.getProvider();

        // Check timer
        const txTimerID = store.getters['txManager/txTimerID'];

        if (!txTimerID)
            return {
                isCanceled: true,
            };

        store.dispatch('txManager/setTxTimerID', null);

        if (!ethersProvider) throw new Error('EVM provider is not available');
        if (!ethersProvider.getSigner()) throw new Error('EVM provider is not available');

        try {
            const signer = ethersProvider.getSigner();

            console.log('TRANSACTION TO SIGN:', transaction);

            const txn = await signer.sendTransaction(transaction);

            console.log('Transaction sent:', txn);

            const { hash } = txn;

            return {
                transactionHash: hash,
                ...txn,
            };
        } catch (e) {
            return errorRegister(e);
        }
    }

    // ****************************************************
    // * Explorer methods
    // ****************************************************

    getTxExplorerLink(txHash: string, chainInfo: any): string {
        const { explorers = [] } = chainInfo || {};

        const [explorer] = explorers || [];

        return `${explorer}/tx/${txHash}`;
    }

    getTokenExplorerLink(tokenAddress: string, chainInfo: any): string {
        const { explorers = [] } = chainInfo || {};
        const [explorer] = explorers || [];

        return `${explorer}/token/${tokenAddress}`;
    }

    // ****************************************************
    // * Utils
    // ****************************************************

    validateAddress(address: string, { validation }: any): boolean {
        return validateEthAddress(address, validation);
    }
}

export default EthereumAdapter.getInstance();
