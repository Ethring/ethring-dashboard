import { values } from 'lodash';
import { Ref, ref, computed } from 'vue';
import { useStore, Store } from 'vuex';
import { useRouter } from 'vue-router';

import * as GETTERS from '@/core/wallet-adapter/store/getters';
import * as TYPES from '@/core/wallet-adapter/store/types';

import { IConnectedWallet } from '@/shared/models/types/Account';
import { IChainConfig } from '@/shared/models/types/chain-config';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

import { ITransactionResponse } from '@/core/transaction-manager/types/Transaction';

// * Mixpanel Tracking
import mixpanel from 'mixpanel-browser';
import { reset } from '@/app/modules/mixpanel/track';
import { TransactionAction, TransactionActionType } from '@/shared/models/enums/tx-actions.enum';
import { IBaseAdapter, IChainInfo, ICosmosAdapter, IEthereumAdapter } from '../models/ecosystem-adapter';

export interface IAdapter {
    isConnecting: Ref<boolean>;
    ecosystem: Ref<Ecosystems>;
    connectedWallet: Ref<IConnectedWallet | null>;
    walletAccount: Ref<string | null>;
    walletAddress: Ref<string | null>;
    currentChainInfo: Ref<IChainInfo | null>;
    connectedWallets: Ref<IConnectedWallet[]>;
    chainList: Ref<IChainConfig[]>;

    // ****************************************************
    // * Initial Adapter
    // ****************************************************

    initAdapter: () => Promise<void>;

    // ****************************************************
    // * Store Actions
    // ****************************************************

    action: (action: string, args: any[]) => void;

    // ****************************************************
    // * Wallet Connection & Disconnection
    // ****************************************************

    connectTo: (ecosystem: Ecosystems, ...args: any[]) => Promise<boolean>;
    connectByEcosystems: (ecosystem: Ecosystems) => Promise<boolean>;

    disconnectWallet: (ecosystem: Ecosystems, wallet: IConnectedWallet) => Promise<void>;
    disconnectAllWallets: () => Promise<void>;

    connectLastConnectedWallet: () => Promise<void | boolean>;

    // ****************************************************
    // * Wallet Address & Account & Chain methods
    // ****************************************************

    getDefaultAddress: () => string | null;
    getAccountByEcosystem: (ecosystem: Ecosystems) => string | null;
    getWalletsModuleByEcosystem: (ecosystem: Ecosystems) => string[];
    getAddressesWithChainsByEcosystem: (ecosystem: Ecosystems, options?: { hash: boolean }) => Promise<Record<string, string>>;

    // ****************************************************
    // * Wallet chain methods
    // ****************************************************

    setChain: (chainInfo: IChainConfig) => Promise<boolean>;
    setNewChain: (ecosystem: Ecosystems, newChainInfo: IChainConfig) => Promise<boolean>;

    getAllChainsList: () => IChainConfig[];
    getNativeTokenByChain: (ecosystem: Ecosystems, chain: IChainConfig, store: any) => any;
    getIBCAssets: (ecosystem: Ecosystems, chain: IChainConfig) => any[];
    getWalletLogo: (ecosystem: Ecosystems, module: string) => Promise<string>;
    getChainListByEcosystem: (ecosystem: Ecosystems, allChains?: boolean) => IChainConfig[];
    getChainByChainId: (ecosystem: Ecosystems | null, chainId: string | number) => IChainConfig | null;

    // ****************************************************
    // * Transaction methods
    // ****************************************************

    callTransactionAction(
        action: string,
        { ecosystem, parameters, txParams }: { ecosystem: Ecosystems; parameters: any; txParams: any },
    ): Promise<ITransactionResponse>;

    // ****************************************************
    // * Transaction signing methods
    // ****************************************************

    signSend: (transaction: ITransactionResponse, { ecosystem }: { ecosystem: Ecosystems | null }) => Promise<any>;

    // ****************************************************
    // * Explorer methods
    // ****************************************************

    getTxExplorerLink: (hash: string, chainInfo: IChainConfig) => string | null;
    getTokenExplorerLink: (tokenAddress: string, chain: string) => string | null;

    // ****************************************************
    // * Utils
    // ****************************************************

    validateAddress: (address: string, { chainId }: { chainId: string | number }) => boolean;
    switchEcosystem: (ecosystem: Ecosystems) => Promise<void>;
    getConnectedStatus: (ecosystem: Ecosystems) => boolean;
    getAdapterByEcosystem: (ecosystem: Ecosystems) => any;

    callContractMethod: (transaction: any, ecosystem: Ecosystems) => Promise<void>;
}

function useAdapter({ tmpStore }: { tmpStore?: Store<any> | null } = { tmpStore: null }): IAdapter {
    // * Store Module
    const store = tmpStore || useStore();
    const router = useRouter();

    const storeModule = 'adapters';
    const walletsSubscription: Ref<any> = ref(null);

    // * Store Getters & Dispatch
    const adaptersGetter = (getter: string) => store.getters[`${storeModule}/${getter}`];
    const adaptersDispatch = (dispatch: string, ...args: any[]) => store.dispatch(`${storeModule}/${dispatch}`, ...args);

    // ****************************************************
    // * Adapter Initialization
    // ****************************************************
    const initAdapter = async () => {
        store.dispatch('configs/setConfigLoading', true);

        for (const ecosystem in Ecosystem) {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
            if (adapter?.init) await adapter.init(store);
        }

        store.dispatch('configs/setConfigLoading', false);
    };

    // * Last Connected Wallet
    const lastConnectedWallet = computed<IConnectedWallet>(() => adaptersGetter(GETTERS.LAST_CONNECTED_WALLET));

    const currEcosystem = computed<Ecosystems>(() => adaptersGetter(GETTERS.CURRENT_ECOSYSTEM));

    // * Main Adapter for current ecosystem
    const mainAdapter = computed<ICosmosAdapter | IEthereumAdapter>(() => adaptersGetter(GETTERS.CURRENT_ADAPTER));

    // * Main Variables
    const isConnecting = computed<boolean>(() => adaptersGetter(GETTERS.IS_CONNECTING));

    const connectedWallets = computed<IConnectedWallet[]>(() => adaptersGetter(GETTERS.CONNECTED_WALLETS));

    const currentChainInfo = computed<IChainInfo>(() => (mainAdapter.value ? mainAdapter.value.getCurrentChain(store) : null));

    const chainList = computed<IChainConfig[]>(() =>
        mainAdapter.value && walletAccount.value ? mainAdapter.value.getChainList() : getAllChainsList(),
    );

    const walletAddress = computed<string | null>(() => (mainAdapter.value ? mainAdapter.value.getAccountAddress() : null));
    const walletAccount = computed<string | null>(() => (mainAdapter.value ? mainAdapter.value.getAccount() : null));

    const connectedWallet = computed<IConnectedWallet>(() => (mainAdapter.value ? mainAdapter.value.getConnectedWallet() : null));
    const connectedWalletModule = computed<string | null>(() => (mainAdapter.value ? mainAdapter.value.getWalletModule() : null));

    // * Functions
    function subscribeToWalletsChange() {
        if (!mainAdapter.value?.subscribeToWalletsChange) return;

        const wallets = mainAdapter.value?.subscribeToWalletsChange();

        if (!wallets) return;

        walletsSubscription.value = wallets.subscribe(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (mainAdapter.value?.updateStates) await mainAdapter.value?.updateStates();
            await storeWalletInfo();
        });
    }

    function unsubscribeFromWalletsChange(adapter: any) {
        if (!adapter?.unsubscribeFromWalletsChange) return;

        adapter.unsubscribeFromWalletsChange(walletsSubscription.value);

        if (walletsSubscription.value) walletsSubscription.value = null; // Reset subscription
    }

    // * Store Wallet Info
    async function storeWalletInfo(): Promise<void> {
        if (!currEcosystem.value) return;

        const walletInfo = {
            id: `${currEcosystem.value}-${currentChainInfo.value?.walletName}`,
            account: mainAdapter.value?.getAccount(),
            address: mainAdapter.value?.getAccountAddress(),
            addresses: await getAddressesWithChainsByEcosystem(currEcosystem.value),
            chain: currentChainInfo.value?.chainName || currentChainInfo.value?.chain_id,
            ecosystem: currEcosystem.value,
            walletName: currentChainInfo.value?.walletName,
            walletModule: connectedWalletModule.value,
        };

        if (
            currentChainInfo.value?.ecosystem !== walletInfo.ecosystem ||
            !walletInfo.address ||
            !walletInfo.walletName ||
            !walletInfo.ecosystem
        )
            return;

        adaptersDispatch(TYPES.SET_WALLET, { ecosystem: currEcosystem.value, wallet: walletInfo });
        adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
        adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem: currEcosystem.value, isConnected: true });

        // return subscribeToWalletsChange();
    }

    // * Connect to Wallet by Ecosystem
    const connectTo = async (ecosystem: Ecosystems, walletModule?: string, chainName?: string): Promise<boolean> => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        try {
            const { isConnected, walletName } = await adapter.connectWallet(walletModule, chainName);

            if (adapter?.getAccount()) adaptersDispatch(TYPES.SET_ACCOUNT_BY_ECOSYSTEM, { ecosystem, account: adapter.getAccount() });

            if (walletName && isConnected) {
                adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);
                adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem, isConnected });
                adaptersDispatch(TYPES.SET_IS_CONNECTING, true);
                await storeWalletInfo();
            }

            subscribeToWalletsChange();

            return isConnected;
        } catch (error) {
            console.error('Failed to connect to:', ecosystem, error);
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem, isConnected: false });
            return false;
        }
    };

    // * Connect to Wallet by Ecosystems
    const connectByEcosystems = async (ecosystem: Ecosystems): Promise<boolean> => {
        if (!ecosystem) return false;

        await adaptersDispatch(TYPES.SET_MODAL_STATE, { name: 'wallets', isOpen: ecosystem === Ecosystem.COSMOS });

        try {
            const status = await connectTo(ecosystem);
            status && adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            return status;
        } catch (error) {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            console.warn('Failed to connect to:', ecosystem, error);
            return false;
        } finally {
            subscribeToWalletsChange();
        }
    };

    // * Connect to another connected wallet, if last connected not available
    const connectAnotherConnectedWallet = async (lastModule: string): Promise<boolean> => {
        const connectedWallet = connectedWallets.value.find((wallet) => wallet.walletModule !== lastModule);

        if (!connectedWallet) return false;

        const { ecosystem, chain, walletModule } = connectedWallet;

        return await connectTo(ecosystem, walletModule, chain as string);
    };

    // * Connect to Last Connected Wallet
    const connectLastConnectedWallet = async (): Promise<void | boolean> => {
        if (!lastConnectedWallet.value || walletAddress.value) return;

        const { ecosystem, chain, walletModule } = lastConnectedWallet.value;

        if (!ecosystem || !chain || !walletModule) return;

        try {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

            const isConnect = await connectTo(ecosystem, walletModule, chain as string);

            if (!isConnect) {
                console.warn('Failed to connect to last connected wallet', ecosystem, chain, walletModule);

                const isConnected = connectAnotherConnectedWallet(walletModule);

                if (!isConnected) {
                    adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
                    adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem, isConnected: false });
                    router.push('/connect-wallet');
                    return;
                }
            }

            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);

            return subscribeToWalletsChange();
        } catch (error) {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem, isConnected: false });
        }
    };

    // * Get Wallets Module by Ecosystem
    const getWalletsModuleByEcosystem = (ecosystem: Ecosystems): string[] => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getMainWallets() || [];
    };

    // * Set Chain for current ecosystem
    const setChain = async (chainInfo: IChainInfo): Promise<boolean> => {
        if (!mainAdapter.value) return false;

        try {
            const changed = await mainAdapter.value.setChain(chainInfo);

            if (changed) await storeWalletInfo();

            return changed;
        } catch (error) {
            console.log('Failed to set chain', error);
            return false;
        }
    };

    // * Get All Chains for Ecosystems
    const getAllChainsList = () => {
        const chainsHash = {} as Record<string, IChainConfig>;

        for (const ecosystem in Ecosystem) {
            const chainList = getChainListByEcosystem(ecosystem as Ecosystems);
            if (!chainList?.length) continue;
            chainList.forEach((chain) => {
                if (chainsHash[chain.net]) return;
                if (chain.net === 'berachain') chain.isTestNet = true;
                chainsHash[chain.net] = chain;
            });
        }

        return values(chainsHash);
    };

    // * Disconnect Wallet by Ecosystem
    const disconnectWallet = async (ecosystem: Ecosystems, wallet: IConnectedWallet): Promise<void> => {
        const { walletModule } = wallet || {};

        if (ecosystem === currEcosystem.value) console.log('disconnectWallet curr', ecosystem, walletModule);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        unsubscribeFromWalletsChange(adapter);

        adaptersDispatch(TYPES.DISCONNECT_WALLET, wallet);

        await adapter.disconnectWallet(walletModule);

        await storeWalletInfo();
    };

    // * Disconnect All Wallets
    const disconnectAllWallets = async () => {
        for (const ecosystem in Ecosystem) {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
            if (!adapter) continue;
            adapter.disconnectAllWallets && (await adapter.disconnectAllWallets());
            await store.dispatch('tokens/resetIsInitCall', { isAll: true });
        }

        adaptersDispatch(TYPES.DISCONNECT_ALL_WALLETS);
        reset(mixpanel);
    };

    // * Validate Address
    const validateAddress = (address: string, { chainId }: { chainId: string | number }): boolean => {
        if (!mainAdapter.value) return false;

        const validation = currentChainInfo.value.address_validating;

        return mainAdapter.value.validateAddress(address, { validation, chainId });
    };

    // * Format Tx for Ecosystem
    const formatTransactionForSign = (transaction: ITransactionResponse, txParams: { ecosystem: string; [key: string]: any }) => {
        if (!mainAdapter.value) return null;

        const { ecosystem, ...params } = txParams || {};

        if (!ecosystem) return mainAdapter.value.formatTransactionForSign(transaction, params);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return adapter.formatTransactionForSign(transaction, params);
    };

    // * Prepare Transaction
    const prepareTransaction = async (transaction: ITransactionResponse, { ecosystem }: { ecosystem: Ecosystems }) => {
        if (!mainAdapter.value) return null;

        if (!ecosystem) return await mainAdapter.value.prepareTransaction(transaction as any);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter.prepareTransaction(transaction);
    };

    // * Prepare Delegate Transaction
    const prepareDelegateTransaction = async (transaction: ITransactionResponse, { ecosystem }: { ecosystem: Ecosystems }) => {
        if (!ecosystem && mainAdapter.value?.prepareDelegateTransaction)
            return await mainAdapter.value?.prepareDelegateTransaction(transaction as any);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter?.prepareDelegateTransaction(transaction);
    };

    // * Prepare Delegate Transaction
    const prepareMultipleExecuteMsgs = async (transaction: ITransactionResponse, { ecosystem }: { ecosystem: Ecosystems }) => {
        if (!mainAdapter.value) return null;

        if (!ecosystem && mainAdapter.value?.prepareMultipleExecuteMsgs)
            return await mainAdapter.value?.prepareMultipleExecuteMsgs(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter?.prepareMultipleExecuteMsgs(transaction);
    };

    // * Prepare Delegate Transaction
    const callContractMethod = async (transaction: ITransactionResponse, { ecosystem }: { ecosystem: Ecosystems }) => {
        if (!mainAdapter.value) return null;

        if (!ecosystem && mainAdapter.value?.callContractMethod) return await mainAdapter.value?.callContractMethod(transaction as any);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter?.callContractMethod(transaction);
    };

    // * Get Explorer Link by Tx Hash
    const getTxExplorerLink = (hash: string, chainInfo: IChainConfig): string | null => {
        if (!mainAdapter.value) return null;

        if (!mainAdapter.value.getTxExplorerLink) return null;

        return mainAdapter.value.getTxExplorerLink(hash, chainInfo) || null;
    };

    // * Get Explorer Link by Tx Hash
    const getTokenExplorerLink = (tokenAddress: string, chain: string): string | null => {
        const chains = getChainListByEcosystem(currEcosystem.value);

        if (!chains?.length) return null;

        const chainInfo = chains.find(({ net, bech32_prefix }) => net === chain || bech32_prefix === chain);
        if (!chainInfo) return null;

        return mainAdapter.value.getTokenExplorerLink(tokenAddress, chainInfo) || null;
    };

    // * Sign & Send Transaction
    const signSend = async (transaction: ITransactionResponse, { ecosystem = null }: { ecosystem: Ecosystems | null }): Promise<any> => {
        if (!ecosystem) return await mainAdapter.value.signSend(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (!adapter) throw new Error(`Adapter not found for ecosystem: ${ecosystem}`);

        return await adapter.signSend(transaction);
    };

    // * Get Chain List by Ecosystem
    const getChainListByEcosystem = (ecosystem: Ecosystems, allChains?: boolean): IChainConfig[] => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (!adapter) return [];

        if (!adapter.getChainList) return [];

        return adapter.getChainList(allChains);
    };

    // * Get Chain by Chain ID
    const getChainByChainId = (ecosystem: Ecosystems | null = null, chainId: string | number): IChainConfig | null => {
        const getChain = (ecosystem: Ecosystems) => {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

            if (!adapter) return null;

            try {
                const chainList = adapter.getChainList(store);

                const chain = chainList.find((chain: IChainConfig) => `${chain.chain_id}` === `${chainId}` || chain.net === chainId);

                if (!chain) return null;

                return {
                    ...chain,
                    chain: chain?.chain_id,
                    name: chain?.name,
                    logo: chain?.logo,
                    ecosystem,
                };
            } catch (error) {
                return null;
            }
        };

        // * If Ecosystem not provided, get chain from all ecosystems
        if (!ecosystem)
            for (const eco in Ecosystem) {
                const chain = getChain(eco as Ecosystems);
                if (chain) return chain;
            }

        const chain = getChain(ecosystem as Ecosystems);

        if (!chain) return null;

        return chain;
    };

    // * Set New Chain by Ecosystem
    const setNewChain = async (ecosystem: Ecosystems, newChainInfo: IChainConfig): Promise<boolean> => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        const changed = await adapter.setChain(newChainInfo);

        if (changed) {
            adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);
            return true;
        }

        await storeWalletInfo();

        return false;
    };

    // * Get Wallet Logo by Ecosystem
    const getWalletLogo = async (ecosystem: Ecosystems, module: string) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return await adapter.getWalletLogo(module, store);
    };

    // * Get addressesWithChains by Ecosystem
    const getAddressesWithChainsByEcosystem = async (ecosystem: Ecosystems | null, { hash = false } = {}) => {
        if (!ecosystem) return {};

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        const addresses = await adapter.getAddressesWithChains();

        // * Return Hash of Addresses
        if (hash) {
            const hashAddresses = {} as Record<string, string>;
            for (const chain in addresses) hashAddresses[chain] = addresses[chain].address;
            return hashAddresses;
        }

        // * Return Addresses with Logo and Chain Info
        return addresses;
    };

    // * Get Ibc assets for COSMOS ecosystem
    const getIBCAssets = (ecosystem: Ecosystems, chain: IChainConfig) => {
        if (ecosystem !== Ecosystem.COSMOS) return [];

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getIBCAssets(chain);
    };

    // * Get Native asset for by Ecosystem and Chain
    const getNativeTokenByChain = (ecosystem: Ecosystems, chain: IChainConfig, store: any) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getNativeTokenByChain(chain, store);
    };

    const getConnectedStatus = (ecosystem: Ecosystems): boolean => {
        if (!ecosystem) return false;

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (adapter.isLocked()) {
            adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem, isConnected: false });
            return false;
        }

        return adaptersGetter(GETTERS.IS_CONNECTED)(ecosystem);
    };

    const switchEcosystem = async (ecosystem: Ecosystems): Promise<void> => await adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);
    const getAdapterByEcosystem = (ecosystem: Ecosystems): IBaseAdapter => adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

    const getDefaultAddress = (): string | null => {
        if (!mainAdapter.value) return null;

        return mainAdapter.value.getDefaultWalletAddress();
    };

    const callTransactionAction = async (
        action: TransactionActionType,
        {
            ecosystem,
            parameters,
            txParams = {},
        }: {
            ecosystem: Ecosystems;
            parameters: any;
            txParams: any;
        },
    ) => {
        const TX_ACTIONS = {
            [TransactionAction.formatTransactionForSign]: formatTransactionForSign,
            [TransactionAction.prepareTransaction]: prepareTransaction,
            [TransactionAction.prepareDelegateTransaction]: prepareDelegateTransaction,
            [TransactionAction.prepareMultipleExecuteMsgs]: prepareMultipleExecuteMsgs,
            [TransactionAction.callContractMethod]: callContractMethod,
        };

        try {
            if (!action || !TX_ACTIONS[action]) throw new Error(`Invalid transaction action: ${action}`);

            return await TX_ACTIONS[action](parameters, { ecosystem, ...txParams });
        } catch (error) {
            console.error('Failed to call transaction action:', action, error);
            throw new Error(`Failed to call transaction action: ${action}`);
        }
    };

    return {
        // ******************* Variables *******************
        isConnecting,

        ecosystem: currEcosystem,
        connectedWallet,

        walletAccount,
        walletAddress,

        currentChainInfo,
        connectedWallets,

        chainList,

        // ******************* Functions *******************

        // * Init Adapter
        initAdapter,

        // * Store Wallet Info
        action: (action: string, ...args) => {
            const typeHash: any = TYPES;

            if (!typeHash[action]) throw new Error(`Invalid action: ${action}`);

            return adaptersDispatch(typeHash[action], ...args);
        },

        // ******************* Wallet Connection *******************

        connectTo,
        connectByEcosystems,
        connectLastConnectedWallet,
        disconnectWallet,
        disconnectAllWallets,

        // ******************* Wallet Address & Account & Chain methods *******************

        // * Wallet Methods
        getWalletLogo,
        getWalletsModuleByEcosystem,

        // * Address Methods
        getDefaultAddress,
        getAccountByEcosystem: (ecosystem: Ecosystems) => adaptersGetter(GETTERS.GET_ACCOUNT_BY_ECOSYSTEM)(ecosystem),
        getAddressesWithChainsByEcosystem,

        // * Chain Methods
        setChain,
        setNewChain,
        getIBCAssets,
        getAllChainsList,
        getChainByChainId,
        getNativeTokenByChain,
        getChainListByEcosystem,

        // ******************* Transaction methods *******************
        callTransactionAction,
        signSend,
        callContractMethod,

        // ******************* Explorer methods *******************
        getTxExplorerLink,
        getTokenExplorerLink,

        // ******************* Utils *******************
        validateAddress,
        switchEcosystem,
        getConnectedStatus,
        getAdapterByEcosystem,
    };
}

export default useAdapter;
