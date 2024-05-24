import * as ethers from 'ethers';
import { Store } from 'vuex';
import { OnboardAPI } from '@web3-onboard/core';
import { IChainConfig } from '@/shared/models/types/chain-config';

/**
 * Represents the base adapter interface for interacting with a wallet ecosystem.
 */
export interface IBaseAdapter {
    // ****************************************************
    // * Adapter properties
    // ****************************************************

    /**
     * The default chain.
     */
    DEFAULT_CHAIN: string;

    /**
     * Vuex store instance for the adapter.
     */
    store: Store<any>;

    // ****************************************************
    // * Public methods
    // ****************************************************

    /**
     * Initializes the adapter.
     * @param store - The Vuex store instance.
     */
    init(store: Store<any>): Promise<void>;

    /**
     * Checks if the wallet is locked.
     * @returns A boolean indicating whether the wallet is locked.
     */
    isLocked(): boolean;

    // ****************************************************
    // * Wallet Subscription
    // ****************************************************

    /**
     * Subscribes to wallet changes.
     * @returns An object representing the subscription to wallet changes.
     */
    subscribeToWalletsChange(): any;

    /**
     * Unsubscribes from wallet changes.
     * @param walletsSubscription - The subscription object to unsubscribe from.
     */
    unsubscribeFromWalletsChange(walletsSubscription: any): void;

    // ****************************************************
    // * Wallet Connection & Disconnection
    // ****************************************************

    /**
     * Connects the wallet.
     * @param walletName - The name of the wallet to connect.
     * @returns A promise that resolves to an object indicating the connection status and the wallet name, or a boolean value.
     */
    connectWallet(walletName: string | null): Promise<{ isConnected: boolean; walletName: string | null }>;

    /**
     * Disconnects the wallet by label.
     * @param label - The label of the wallet to disconnect.
     * @returns A promise that resolves when the wallet is disconnected.
     */
    disconnectWallet(label: string): Promise<void>;

    /**
     * Disconnects all wallets.
     * @returns A promise that resolves when all wallets are disconnected.
     */
    disconnectAllWallets(): Promise<void>;

    /**
     * Gets the addresses with chains.
     * @returns A promise that resolves to an object with addresses mapped to chains.
     */
    getAddressesWithChains(): Promise<IAddressByNetwork | null>;

    // ****************************************************
    // * Wallet Info methods
    // ****************************************************

    /**
     * Gets the main wallets.
     * @returns An array of main wallets.
     */
    getMainWallets(): any[];

    /**
     * Gets the wallet module.
     * @returns The wallet module as a string, or null if not available.
     */
    getWalletModule(): string | null;

    /**
     * Gets the wallet module logo.
     * @param walletModule - The wallet module as a string, or null if not available.
     * @param store - The Vuex store instance.
     * @returns A promise that resolves to the wallet module logo as a string, or null if not available.
     */
    getWalletLogo(walletModule: string | null, store?: any): Promise<string | null>;

    // ****************************************************
    // * Wallet Address & Account & Chain methods
    // ****************************************************

    /**
     * Gets the account.
     * @returns The account as a string, or null if not available.
     */
    getAccount(): string | null;

    /**
     * Gets the account address.
     * @returns The account address as a string, or null if not available.
     */
    getAccountAddress(): string | null;

    /**
     * Gets the current chain.
     * @param store - The Vuex store instance.
     * @returns The current chain object.
     */
    getCurrentChain(store: Store<any>): any;

    /**
     * Gets the connected wallet.
     * @returns The connected wallet object.
     */
    getConnectedWallet(): any;

    /**
     * Get default wallet address
     * @returns The default wallet address string
     */
    getDefaultWalletAddress(): string | null;

    // ****************************************************
    // * Wallet chain methods
    // ****************************************************

    /**
     * Gets the native token by chain.
     * @param chain - The chain name.
     * @param store - The Vuex store instance.
     * @returns The native token object for the specified chain.
     */
    getNativeTokenByChain(chain: string, store: any): any;

    /**
     * Gets the chain list.
     * @param store - The Vuex store instance.
     * @returns An array of chain objects.
     */
    getChainList(): IChainInfo[];

    /**
     * Sets or changes the chain.
     * @param chainInfo - The chain information object.
     * @returns A promise that resolves to a boolean indicating whether the chain was set or changed successfully.
     */
    setChain(chainInfo: IChainInfo): Promise<boolean>;

    // ****************************************************
    // * Transaction methods
    // ****************************************************

    /**
     * Formats the transaction for sign.
     * @param transaction - The transaction object.
     * @returns A promise that resolves to the formatted transaction object.
     */
    formatTransactionForSign(transaction: any, params: any): Promise<any>;

    /**
     * Prepares the transfer transaction.
     * @param params - The transaction parameters.
     * @returns A promise that resolves to the prepared transaction object.
     */
    prepareTransaction(params: { fromAddress: string; toAddress: string; amount: string; token: any }): Promise<any>;

    /**
     * Prepares the delegate transaction.
     * @param params - The transaction parameters.
     * @returns A promise that resolves to the prepared transaction object.
     */
    prepareDelegateTransaction?: (params: { fromAddress: string; toAddress: string; amount: string; token: any }) => Promise<any>;

    /**
     * Prepares the multiple calling transaction.
     * @param params - The transaction parameters.
     * @returns A promise that resolves to the prepared transaction object.
     */
    prepareMultipleExecuteMsgs?: (params: any) => Promise<any>;

    /**
     * Prepares the contract method call transaction.
     * @param params - The transaction parameters.
     * @returns A promise that resolves to the prepared transaction object.
     */
    callContractMethod?: (params: any) => Promise<any>;

    // ****************************************************
    // * Transaction signing methods
    // ****************************************************

    /**
     * Signs and sends the transaction.
     * @param transaction - The transaction object.
     * @returns A promise that resolves to the signed and sent transaction object.
     */
    signSend(transaction: any): Promise<any>;

    // ****************************************************
    // * Explorer methods
    // ****************************************************

    /**
     * Gets the transaction explorer link.
     * @param txHash - The transaction hash.
     * @param chainInfo - The chain information object.
     * @returns The transaction explorer link as a string.
     */
    getTxExplorerLink(txHash: string, chainInfo: any): string | null;

    /**
     * Gets the token explorer link.
     * @param tokenAddress - The token address.
     * @param chainInfo - The chain information object.
     * @returns The token explorer link as a string.
     */
    getTokenExplorerLink(tokenAddress: string, chainInfo: any): string | null;

    // ****************************************************
    // * Utils
    // ****************************************************

    /**
     * Validates the address by chain/validation regex.
     * @param address - The address to validate.
     * @param options - The validation options.
     * @returns A boolean indicating whether the address is valid.
     */
    validateAddress(address: string, options?: { validation?: any; chainId?: any }): boolean;

    /**
     * Method to update the states.
     * @returns A promise that resolves when the states are updated.
     */
    updateStates?: () => Promise<void>;
}

/**
 * Represents an Ethereum adapter for interacting with the Ethereum blockchain.
 */
export interface IEthereumAdapter extends IBaseAdapter {
    /**
     * Wallet manager for the adapter. (OnboardAPI blocknative instance)
     */
    walletManager: OnboardAPI;

    /**
     * Object with addresses by network.
     */
    addressByNetwork: IAddressByNetwork;

    // ****************************************************
    // * Wallet Address & Chain Info
    // ****************************************************

    /**
     * Sets the address for chains.
     */
    setAddressForChains(): void;

    /**
     * Method to get the Ethereum provider.
     * @returns The Ethereum provider or null if not available.
     */
    getProvider(): ethers.providers.Web3Provider | null;

    /**
     * Method to call a contract method.
     * @param params - The parameters for calling the contract method.
     * @returns A promise that resolves to the result of the contract method call.
     */
    callContractMethod(params: { contractAddress: string; method: string; args: any[]; abi?: string }): Promise<any>;
}

export interface ICosmosAdapter extends IBaseAdapter {
    addressByNetwork: {
        [key: string]: IAddressByNetwork;
    };

    STANDARD_SLIP_44: number;
    REFRESH_EVENT: string;
    DEFAULT_NAME_SERVICE: string;

    /**
     * Method to set the address for chains.
     * @returns A promise that resolves when the address is set for chains.
     */
    setAddressForChains(walletName: string): Promise<void>;

    /**
     * Method to check if the client is available.
     * @returns A boolean indicating whether the client is available.
     */
    checkClient(walletName: string): boolean;
}

export interface ICosmosFeeTokens {
    denom: string;
    fixed_min_gas_price?: number;
    low_gas_price?: number;
    average_gas_price?: number;
    high_gas_price?: number;
    gas_costs?: {
        cosmos_send?: number;
        ibc_transfer?: number;
    };
}

export interface IChainAddressInfo {
    address: string;
    logo: string | null;
    nativeTokenLogo?: string;
}

export interface IAddressByNetwork {
    [key: string]: IChainAddressInfo | null;
}

export interface IChainInfo extends IChainConfig {
    walletModule?: string;
    walletName?: string;
}
