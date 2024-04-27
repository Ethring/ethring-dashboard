import { Ref, ref, computed } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { ECOSYSTEMS } from '@/core/wallet-adapter/config';

import * as GETTERS from '@/core/wallet-adapter/store/getters';
import * as TYPES from '@/core/wallet-adapter/store/types';

import { ChainConfig } from '@/modules/chain-configs/types/chain-config';
import { ITransactionResponse } from '@/core/transaction-manager/types/Transaction';

interface WalletInfo {
    id: string;
    account: any;
    address: string | null;
    addresses: Record<string, string>;
    chain: string | number | null;
    ecosystem: string | null;
    walletName: string | null;
    walletModule: string | null;
}

interface ChainInfo extends ChainConfig, WalletInfo {
    name: string;
    logo: string;
    chain_id: string | number;
    ecosystem: string;
    chainName?: string;
}

// export interface IAdapter {
//     initAdapter: () => Promise<void>;
//     connectTo: (ecosystem: keyof typeof ECOSYSTEMS, ...args: any[]) => Promise<boolean>;
//     connectByEcosystems: (ecosystem: keyof typeof ECOSYSTEMS) => Promise<void>;
//     connectLastConnectedWallet: () => Promise<void | boolean>;
//     getWalletsModuleByEcosystem: (ecosystem: keyof typeof ECOSYSTEMS) => string[];
//     getAddressesWithChainsByEcosystem: (ecosystem: keyof typeof ECOSYSTEMS, options?: { hash: boolean }) => Promise<Record<string, string>>;
//     getTxExplorerLink: (hash: string, chainInfo: ChainInfo) => string;
//     getTokenExplorerLink: (tokenAddress: string, chain: string) => string;
//     setChain: (chainInfo: ChainInfo) => Promise<boolean>;
//     setNewChain: (ecosystem: keyof typeof ECOSYSTEMS, newChainInfo: ChainInfo) => Promise<boolean>;
//     validateAddress: (address: string, { chainId }) => boolean;
//     formatTransactionForSign: (transaction: ITransactionResponse, txParams: { ecosystem: string; [key: string]: any }) => ITransaction;
//     prepareTransaction: (transaction: ITransactionResponse, { ecosystem }) => Promise<ITransaction>;
//     prepareDelegateTransaction: (transaction: ITransactionResponse, { ecosystem }) => Promise<ITransaction>;
//     prepareMultipleExecuteMsgs: (transaction: ITransactionResponse, { ecosystem }) => Promise<ITransaction>;
//     signSend: (transaction: ITransactionResponse, { ecosystem }) => Promise<any>;
//     getChainListByEcosystem: (ecosystem: keyof typeof ECOSYSTEMS) => ChainConfig[];
//     getChainByChainId: (ecosystem: keyof typeof ECOSYSTEMS, chainId: string | number) => ChainConfig;
//     getWalletLogo: (ecosystem: keyof typeof ECOSYSTEMS, module: string) => Promise<string>;
//     getIBCAssets: (ecosystem: keyof typeof ECOSYSTEMS, chain: ChainInfo) => any[];
// }

function useAdapter() {
    // * Store Module
    const store = useStore();
    const router = useRouter();

    const storeModule = 'adapters';
    const walletsSubscription: Ref<any> | null = ref(null);

    // * Store Getters & Dispatch
    const adaptersGetter = (getter: string) => store.getters[`${storeModule}/${getter}`];
    const adaptersDispatch = (dispatch: string, ...args: any[]) => store.dispatch(`${storeModule}/${dispatch}`, ...args);

    const initAdapter = async () => {
        store.dispatch('configs/setConfigLoading', true);

        for (const ecosystem in ECOSYSTEMS) {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
            if (adapter?.init) await adapter.init(store);
        }

        store.dispatch('configs/setConfigLoading', false);
    };

    // * Last Connected Wallet
    const lastConnectedWallet = computed<WalletInfo>(() => adaptersGetter(GETTERS.LAST_CONNECTED_WALLET));

    const currEcosystem = computed<keyof typeof ECOSYSTEMS>(() => adaptersGetter(GETTERS.CURRENT_ECOSYSTEM));

    // * Main Adapter for current ecosystem
    const mainAdapter = computed(() => adaptersGetter(GETTERS.CURRENT_ADAPTER));

    // * Main Variables
    const isConnecting = computed<boolean>(() => adaptersGetter(GETTERS.IS_CONNECTING));

    const connectedWallets = computed<WalletInfo[]>(() => adaptersGetter(GETTERS.CONNECTED_WALLETS));

    const currentChainInfo = computed<ChainInfo>(() => (mainAdapter.value ? mainAdapter.value.getCurrentChain(store) : null));

    const chainList = computed<ChainConfig[]>(() => (mainAdapter.value ? mainAdapter.value.getChainList(store) : []));

    const walletAddress = computed<string>(() => (mainAdapter.value ? mainAdapter.value.getAccountAddress() : null));
    const walletAccount = computed<string>(() => (mainAdapter.value ? mainAdapter.value.getAccount() : null));

    const connectedWallet = computed<WalletInfo>(() => (mainAdapter.value ? mainAdapter.value.getConnectedWallet() : null));
    const connectedWalletModule = computed<string>(() => (mainAdapter.value ? mainAdapter.value.getWalletModule() : null));

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

    function unsubscribeFromWalletsChange(adapter) {
        if (!adapter?.unsubscribeFromWalletsChange) return;

        adapter.unsubscribeFromWalletsChange(walletsSubscription.value);

        if (walletsSubscription.value) walletsSubscription.value = null; // Reset subscription
    }

    // * Store Wallet Info
    async function storeWalletInfo() {
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
    const connectTo = async (ecosystem, ...args) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        try {
            const { isConnected, walletName } = await adapter.connectWallet(...args);

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
    const connectByEcosystems = async (ecosystem: keyof typeof ECOSYSTEMS) => {
        if (!ecosystem) return false;

        if (ecosystem === ECOSYSTEMS.COSMOS) return await adaptersDispatch(TYPES.SET_MODAL_STATE, { name: 'wallets', isOpen: true });

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

        return await connectTo(ecosystem, walletModule, chain);
    };

    // * Connect to Last Connected Wallet
    const connectLastConnectedWallet = async (): Promise<void | boolean> => {
        if (!lastConnectedWallet.value || walletAddress.value) return;

        const { ecosystem, chain, walletModule } = lastConnectedWallet.value;

        if (!ecosystem || !chain || !walletModule) return;

        try {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

            const isConnect = await connectTo(ecosystem, walletModule, chain);

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
    const getWalletsModuleByEcosystem = (ecosystem: keyof typeof ECOSYSTEMS): string[] => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getMainWallets() || [];
    };

    // * Set Chain for current ecosystem
    const setChain = async (...args) => {
        if (!mainAdapter.value) return;

        try {
            const changed = await mainAdapter.value.setChain(...args);

            await storeWalletInfo();

            return changed;
        } catch (error) {
            console.log('Failed to set chain', error);
            return false;
        }
    };

    // * Disconnect Wallet by Ecosystem
    const disconnectWallet = async (ecosystem: keyof typeof ECOSYSTEMS, wallet: WalletInfo): Promise<void> => {
        const { walletModule } = wallet || {};

        if (ecosystem === currEcosystem.value) console.log('disconnectWallet curr', ecosystem, walletModule);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        unsubscribeFromWalletsChange(adapter);

        adaptersDispatch(TYPES.DISCONNECT_WALLET, wallet);

        await adapter.disconnectWallet(walletModule);

        if (!connectedWallets.value.length) router.push('/connect-wallet');

        await storeWalletInfo();
    };

    // * Disconnect All Wallets
    const disconnectAllWallets = async (...args) => {
        for (const ecosystem in ECOSYSTEMS) {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
            await adapter.disconnectAllWallets(...args);
        }

        router.push('/connect-wallet');

        adaptersDispatch(TYPES.DISCONNECT_ALL_WALLETS);
    };

    // * Validate Address
    const validateAddress = (address: string, { chainId }): boolean => {
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
    const prepareTransaction = async (transaction: ITransactionResponse, { ecosystem }) => {
        if (!mainAdapter.value) return null;

        if (!ecosystem) return await mainAdapter.value.prepareTransaction(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter.prepareTransaction(transaction);
    };

    // * Prepare Delegate Transaction
    const prepareDelegateTransaction = async (transaction: ITransactionResponse, { ecosystem }) => {
        if (!ecosystem && mainAdapter.value?.prepareDelegateTransaction)
            return await mainAdapter.value?.prepareDelegateTransaction(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter?.prepareDelegateTransaction(transaction);
    };

    // * Prepare Delegate Transaction
    const prepareMultipleExecuteMsgs = async (transaction: ITransactionResponse, { ecosystem }) => {
        if (!mainAdapter.value) return null;

        if (!ecosystem && mainAdapter.value?.prepareMultipleExecuteMsgs)
            return await mainAdapter.value?.prepareMultipleExecuteMsgs(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter?.prepareMultipleExecuteMsgs(transaction);
    };
    // * Prepare Delegate Transaction
    const callContractMethod = async (transaction: ITransactionResponse, { ecosystem }) => {
        if (!mainAdapter.value) return null;

        if (!ecosystem && mainAdapter.value?.callContractMethod) return await mainAdapter.value?.callContractMethod(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter?.callContractMethod(transaction);
    };

    // * Get Explorer Link by Tx Hash
    const getTxExplorerLink = (hash: string, chainInfo: ChainInfo): string => {
        if (!mainAdapter.value) return null;

        if (!mainAdapter.value.getTxExplorerLink) return null;

        return mainAdapter.value.getTxExplorerLink(hash, chainInfo) || null;
    };

    // * Get Explorer Link by Tx Hash
    const getTokenExplorerLink = (tokenAddress: string, chain: string): string => {
        const chains = getChainListByEcosystem(currEcosystem.value);

        if (!chains?.length) return null;

        const chainInfo = chains.find(({ net, bech32_prefix }) => net === chain || bech32_prefix === chain);

        return mainAdapter.value.getTokenExplorerLink(tokenAddress, chainInfo) || null;
    };

    // * Sign & Send Transaction
    const signSend = async (transaction: ITransactionResponse, { ecosystem = null }) => {
        if (!ecosystem) return await mainAdapter.value.signSend(transaction);

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (!adapter) return { error: `Please connect your ${ecosystem} wallet` };

        return await adapter.signSend(transaction);
    };

    // * Get Chain List by Ecosystem
    const getChainListByEcosystem = (ecosystem: keyof typeof ECOSYSTEMS): ChainConfig[] => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (!adapter) return [];

        if (!adapter.getChainList) return [];

        return adapter.getChainList(store);
    };

    // * Get Chain by Chain ID
    const getChainByChainId = (ecosystem: string | null = null, chainId: string | number | null): ChainConfig | null => {
        const getChain = (ecosystem: keyof typeof ECOSYSTEMS) => {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

            if (!adapter) return null;

            try {
                const chainList = adapter.getChainList(store);

                const chain = chainList.find((chain: ChainConfig) => `${chain.chain_id}` === `${chainId}` || chain.net === chainId);

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
            for (const ecosystem in ECOSYSTEMS) {
                const chain = getChain(ecosystem as keyof typeof ECOSYSTEMS);
                if (chain) return chain;
            }

        const chain = getChain(ecosystem);

        if (!chain) return null;

        return chain;
    };

    // * Set New Chain by Ecosystem
    const setNewChain = async (ecosystem: keyof typeof ECOSYSTEMS, newChainInfo: ChainInfo): Promise<boolean> => {
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
    const getWalletLogo = async (ecosystem: keyof typeof ECOSYSTEMS, module: string) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return await adapter.getWalletLogo(module, store);
    };

    // * Get addressesWithChains by Ecosystem
    const getAddressesWithChainsByEcosystem = async (ecosystem: keyof typeof ECOSYSTEMS | null, { hash = false } = {}) => {
        if (!ecosystem) return {};

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        const addresses = await adapter.getAddressesWithChains();

        // * Return Hash of Addresses
        if (hash) {
            const hashAddresses = {};
            for (const chain in addresses) hashAddresses[chain] = addresses[chain].address;
            return hashAddresses;
        }

        // * Return Addresses with Logo and Chain Info
        return addresses;
    };

    // * Get Ibc assets for COSMOS ecosystem
    const getIBCAssets = (ecosystem: keyof typeof ECOSYSTEMS, chain: ChainInfo) => {
        if (ecosystem !== ECOSYSTEMS.COSMOS) return [];

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getIBCAssets(chain);
    };

    // * Get Native asset for by Ecosystem and Chain
    const getNativeTokenByChain = (ecosystem: keyof typeof ECOSYSTEMS, chain: ChainInfo, store: any) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getNativeTokenByChain(chain, store);
    };

    const getConnectedStatus = (ecosystem: keyof typeof ECOSYSTEMS): boolean => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (adapter.isLocked()) {
            adaptersDispatch(TYPES.SET_IS_CONNECTED, { ecosystem, isConnected: false });
            return false;
        }

        return adaptersGetter(GETTERS.IS_CONNECTED)(ecosystem);
    };

    const switchEcosystem = async (ecosystem: keyof typeof ECOSYSTEMS): Promise<void> =>
        await adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);

    const getContractInfo = async (ecosystem: keyof typeof ECOSYSTEMS, chainInfo: ChainConfig, contract: string) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        await setChain(chainInfo);

        return adapter.getContractInfo(contract);
    };

    const getAdapterByEcosystem = (ecosystem: keyof typeof ECOSYSTEMS) => adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

    const callTransactionAction = async (action: string, { ecosystem, parameters, txParams = {} }) => {
        const TX_ACTIONS = {
            formatTransactionForSign,
            prepareTransaction,
            prepareDelegateTransaction,
            prepareMultipleExecuteMsgs,
            callContractMethod,
        };

        try {
            if (!action || !TX_ACTIONS[action]) {
                console.error('Unknown action', action);
                throw new Error(`Invalid transaction action: ${action}`);
            }

            console.log('Calling transaction action:', action, parameters, { ecosystem, ...txParams });

            return await TX_ACTIONS[action](parameters, { ecosystem, ...txParams });
        } catch (error) {
            console.error('Failed to call transaction action:', action, error);
            throw new Error(`Failed to call transaction action: ${action}`);
        }
    };

    return {
        isConnecting,

        ecosystem: currEcosystem,
        connectedWallet,

        walletAccount,
        walletAddress,

        currentChainInfo,
        connectedWallets,

        chainList,

        initAdapter,

        action: (action, ...args) => adaptersDispatch(TYPES[action], ...args),

        connectTo,
        connectByEcosystems,
        connectLastConnectedWallet,

        getWalletLogo,
        getWalletsModuleByEcosystem,
        getAddressesWithChainsByEcosystem,
        getChainListByEcosystem,
        getChainByChainId,

        getTxExplorerLink,
        getTokenExplorerLink,
        getIBCAssets,
        getNativeTokenByChain,

        setChain,
        setNewChain,

        validateAddress,

        // * Transaction Actions
        formatTransactionForSign,
        prepareTransaction,
        prepareDelegateTransaction,
        prepareMultipleExecuteMsgs,

        callTransactionAction,

        signSend,

        disconnectWallet,
        disconnectAllWallets,

        getConnectedStatus,
        switchEcosystem,

        getContractInfo,

        getAdapterByEcosystem,
    };
}

export default useAdapter;
