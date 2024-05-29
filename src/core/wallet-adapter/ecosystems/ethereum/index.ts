import { Store } from 'vuex';
import * as ethers from 'ethers';
import { values, orderBy } from 'lodash';
import { useLocalStorage } from '@vueuse/core';

// * Web3-onboard (Blocknative)
import { InitOptions, ConnectOptions, OnboardAPI } from '@web3-onboard/core';
import { init, useOnboard } from '@web3-onboard/vue';
import { providers, Contract, utils } from 'ethers';

// * Types
import { IEthereumAdapter, IAddressByNetwork, IChainInfo } from '@/core/wallet-adapter/models/ecosystem-adapter';
import { IConnectedWallet } from '@/shared/models/types/Account';

// * Configs
import { BASE_ABI, SILO_EXECUTE_ABI, BEEFY_DEPOSIT_ABI, web3OnBoardConfig } from '@/core/wallet-adapter/config';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

// * Utils
import Logger from '@/shared/logger';
import { errorRegister } from '@/shared/utils/errors';
import { validateEthAddress } from '@/core/wallet-adapter/utils/validations';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { getBlocknativeConfig } from '@/modules/chain-configs/api';
import { isDefaultChain } from '@/core/wallet-adapter/utils';

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
    store: any;
    walletName: string | null = null;
    walletManager: OnboardAPI | any;
    addressByNetwork: IAddressByNetwork = {};
    DEFAULT_CHAIN: string = 'eth';

    private constructor() {
        this.store = null;
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
        this.store = store;
        const initOptions = web3OnBoardConfig as InitOptions;
        initOptions.chains = await getBlocknativeConfig();
        this.walletManager = init(initOptions);
        this.walletManager.state.select('wallets').subscribe((wallet: any) => {
            if (!wallet?.length && this.walletName) this.connectWallet(this.walletName);
            this.setAddressForChains();
        });
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

    async connectWallet(walletName: string | null): Promise<{ isConnected: boolean; walletName: string | null }> {
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

            if (wallets.length) this.setAddressForChains();

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
        const { disconnectConnectedWallet } = useOnboard();

        try {
            await disconnectConnectedWallet();
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

    setAddressForChains() {
        if (!this.addressByNetwork) this.addressByNetwork = {};

        const { chains } = this.walletManager.state.get();
        const mainAddress = this.getAccountAddress();

        if (!mainAddress) return;

        for (const { id } of chains) {
            if (!id) continue;
            const chainInfo = this.store.getters['configs/getChainConfigByChainId'](id, Ecosystem.EVM) || {};

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
    }

    getDefaultWalletAddress(): string | null {
        const chainWithAddress = this.addressByNetwork[this.DEFAULT_CHAIN];

        if (!chainWithAddress) return null;

        return chainWithAddress.address;
    }

    async getAddressesWithChains(): Promise<IAddressByNetwork> {
        this.setAddressForChains();
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

    async getWalletLogo(walletModule: string | null, store: any): Promise<string | null> {
        if (!walletModule) return null;

        const adaptersDispatch = (...args: { ecosystem: string; wallet: any }[]) => store.dispatch('adapters/SET_WALLET', ...args);

        const updateIcon = async (index: number, icon: string) => {
            if (index === -1) return;

            const connectedWallet: IConnectedWallet = connectedWalletsStorage.value[index];

            if (!connectedWallet) return;

            connectedWallet.icon = icon;

            adaptersDispatch({ ecosystem: Ecosystem.EVM, wallet: connectedWallet });
        };

        const getWalletIconFromStore = () => {
            const index = connectedWalletsStorage.value.findIndex((wallet: IConnectedWallet) => wallet.walletModule === walletModule);
            if (index === -1) return null;

            const wallet: IConnectedWallet = connectedWalletsStorage.value[index];
            if (!wallet) return null;

            updateIcon(index, wallet.icon);

            return wallet.icon;
        };

        const getWalletFromOnboard = async () => {
            const { walletModules } = this.walletManager.state.get() || {};
            const exist = walletModules.find((module: any) => module.label === walletModule);

            if (!exist) return null;

            const index = connectedWalletsStorage.value.findIndex((wallet: IConnectedWallet) => wallet.walletModule === walletModule);

            try {
                const icon = await exist.getIcon();
                updateIcon(index, icon);

                return icon;
            } catch (error) {
                console.error('Failed to get icon for', walletModule, error);
                return null;
            }
        };

        if (getWalletIconFromStore()) return getWalletIconFromStore();

        return await getWalletFromOnboard();
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

    getCurrentChain(): IChainConfig | null {
        const { connectedWallet, connectedChain } = useOnboard();
        const { label = null } = connectedWallet.value || {};

        const { id = null } = connectedChain.value || {};

        if (!id || (id && isNaN(+id))) return null;

        if (!this.store || !this.store.getters) return null;

        const chainInfo = this.store.getters['configs/getChainConfigByChainId'](id, Ecosystem.EVM) || {};

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

    getChainList(allChains: boolean = false): IChainConfig[] {
        if (!this.store) return [];
        if (!this.store.getters['configs/getConfigsListByEcosystem']) return [];

        const chains = this.store.getters['configs/getConfigsListByEcosystem'](Ecosystem.EVM) || [];

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
    }: {
        contractAddress: string;
        method: string;
        args: any[];
        abi?: string;
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

            const populatedTransaction = await contract.populateTransaction[method](...argsToCall);

            response.data = populatedTransaction.data;

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

    async signSend(transaction: any): Promise<any> {
        const ethersProvider = this.getProvider();

        console.log('Transaction to sign:', transaction);
        // Check timer
        const txTimerID = this.store.getters['txManager/txTimerID'];

        if (!txTimerID)
            return {
                isCanceled: true,
            };

        this.store.dispatch('txManager/setTxTimerID', null);

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
