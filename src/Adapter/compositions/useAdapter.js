import { ref, computed, onBeforeUnmount, onMounted } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { ECOSYSTEMS } from '@/Adapter/config';

import * as GETTERS from '../store/getters';
import * as TYPES from '../store/types';

function useAdapter() {
    // * Store Module
    const store = useStore();
    const router = useRouter();

    const storeModule = 'adapters';

    const walletsSubscription = ref(null);

    // * Store Getters & Dispatch
    const adaptersGetter = (getter) => store.getters[`${storeModule}/${getter}`];
    const adaptersDispatch = (dispatch, ...args) => store.dispatch(`${storeModule}/${dispatch}`, ...args);

    const isConfigsLoading = computed(() => store.getters['configs/isConfigLoading']);

    const initAdapter = async () => {
        store.dispatch('configs/setConfigLoading', true);

        for (const ecosystem in ECOSYSTEMS) {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
            if (adapter?.init) {
                await adapter.init(store);
            }
        }

        store.dispatch('configs/setConfigLoading', false);
    };

    // * Last Connected Wallet
    const lastConnectedWallet = computed(() => adaptersGetter(GETTERS.LAST_CONNECTED_WALLET));

    const currEcosystem = computed(() => adaptersGetter(GETTERS.CURRENT_ECOSYSTEM));

    // * Main Adapter for current ecosystem
    const mainAdapter = computed(() => adaptersGetter(GETTERS.CURRENT_ADAPTER));

    // * Main Variables
    const isConnecting = computed(() => adaptersGetter(GETTERS.IS_CONNECTING));

    const connectedWallets = computed(() => adaptersGetter(GETTERS.CONNECTED_WALLETS));
    const currentChainInfo = computed(() => (mainAdapter.value ? mainAdapter.value.getCurrentChain(store) : null));

    const chainList = computed(() => (mainAdapter.value ? mainAdapter.value.getChainList(store) : []));

    const walletAddress = computed(() => (mainAdapter.value ? mainAdapter.value.getAccountAddress() : null));
    const walletAccount = computed(() => (mainAdapter.value ? mainAdapter.value.getAccount() : null));

    const connectedWallet = computed(() => (mainAdapter.value ? mainAdapter.value.getConnectedWallet() : null));
    const connectedWalletModule = computed(() => (mainAdapter.value ? mainAdapter.value.getWalletModule() : null));

    // * Functions
    function subscribeToWalletsChange() {
        if (!mainAdapter.value?.subscribeToWalletsChange) {
            return;
        }

        const wallets = mainAdapter.value?.subscribeToWalletsChange();

        if (!wallets) {
            return;
        }

        if (walletsSubscription.value) {
            unsubscribeFromWalletsChange();
        }

        walletsSubscription.value = wallets.subscribe(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (mainAdapter.value?.updateStates) {
                await mainAdapter.value?.updateStates();
            }

            storeWalletInfo();
        });
    }

    function unsubscribeFromWalletsChange() {
        if (!mainAdapter.value?.unsubscribeFromWalletsChange) {
            return;
        }

        mainAdapter.value?.unsubscribeFromWalletsChange();

        if (walletsSubscription.value) {
            walletsSubscription.value = null; // Reset subscription
        }
    }

    // * Store Wallet Info
    function storeWalletInfo() {
        const walletInfo = {
            id: `${currEcosystem.value}-${currentChainInfo.value?.walletName}`,
            account: mainAdapter.value?.getAccount(),
            address: mainAdapter.value?.getAccountAddress(),
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
        ) {
            return;
        }

        adaptersDispatch(TYPES.SET_WALLET, { ecosystem: currEcosystem.value, wallet: walletInfo });
        adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
        adaptersDispatch(TYPES.SET_IS_CONNECTED, true);
    }

    // * Connect to Wallet by Ecosystem
    const connectTo = async (ecosystem, ...args) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        try {
            const { isConnected, walletName } = await adapter.connectWallet(...args);

            if (adapter?.getAccount()) {
                adaptersDispatch(TYPES.SET_ACCOUNT_BY_ECOSYSTEM, { ecosystem, account: adapter.getAccount() });
            }

            if (walletName && isConnected) {
                adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);
                adaptersDispatch(TYPES.SET_IS_CONNECTED, true);
                adaptersDispatch(TYPES.SET_IS_CONNECTING, true);
                storeWalletInfo();
            }

            return isConnected;
        } catch (error) {
            console.error('Failed to connect to:', ecosystem, error);
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            adaptersDispatch(TYPES.SET_IS_CONNECTED, false);
            return false;
        }
    };

    // * Connect to Wallet by Ecosystems
    const connectByEcosystems = async (ecosystem) => {
        if (!ecosystem) {
            return;
        }

        if (ecosystem === ECOSYSTEMS.COSMOS) {
            return adaptersDispatch(TYPES.SET_MODAL_STATE, { name: 'wallets', isOpen: true });
        }

        try {
            const status = await connectTo(ecosystem);
            status && adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
        } catch (error) {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            console.log(error);
        }
    };

    // * Connect to another connected wallet, if last connected not available
    const connectAnotherConnectedWallet = async (lastModule) => {
        const connectedWallet = connectedWallets.value.find((wallet) => wallet.walletModule !== lastModule);

        if (!connectedWallet) {
            return false;
        }

        const { ecosystem, chain, walletModule } = connectedWallet;
        return await connectTo(ecosystem, walletModule, chain);
    };

    // * Connect to Last Connected Wallet
    const connectLastConnectedWallet = async () => {
        if (!lastConnectedWallet.value || walletAddress.value) {
            return;
        }

        const { ecosystem, chain, walletModule } = lastConnectedWallet.value;

        if (!ecosystem || !chain || !walletModule) {
            return;
        }

        try {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

            const isConnect = await connectTo(ecosystem, walletModule, chain);

            if (!isConnect) {
                console.warn('Failed to connect to last connected wallet', ecosystem, chain, walletModule);

                const isConnected = connectAnotherConnectedWallet(walletModule);

                if (!isConnected) {
                    adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
                    adaptersDispatch(TYPES.SET_IS_CONNECTED, false);
                    return router.push('/connect-wallet');
                }
            }

            if (currentChainInfo.value === 404) {
                await setChain(lastConnectedWallet.value);
            }

            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);

            return subscribeToWalletsChange();
        } catch (error) {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            adaptersDispatch(TYPES.SET_IS_CONNECTED, false);
        }
    };

    // * Get Wallets Module by Ecosystem
    const getWalletsModuleByEcosystem = (ecosystem) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getMainWallets() || [];
    };

    // * Set Chain for current ecosystem
    const setChain = async (...args) => {
        if (!mainAdapter.value) {
            return;
        }

        try {
            const changed = await mainAdapter.value.setChain(...args);

            storeWalletInfo();

            return changed;
        } catch (error) {
            console.log('Failed to set chain', error);
            return false;
        }
    };

    // * Disconnect Wallet by Ecosystem
    const disconnectWallet = async (ecosystem, wallet) => {
        const { walletModule } = wallet || {};

        if (ecosystem === currEcosystem.value) {
            console.log('disconnectWallet curr', ecosystem, walletModule);
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        adaptersDispatch(TYPES.DISCONNECT_WALLET, wallet);

        await adapter.disconnectWallet(walletModule);

        if (!connectedWallets.value.length) {
            router.push('/connect-wallet');
        }

        storeWalletInfo();
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
    const validateAddress = (address, { chainId }) => {
        if (!mainAdapter.value) {
            return false;
        }

        const validation = currentChainInfo.value.address_validating;

        return mainAdapter.value.validateAddress(address, { validation, chainId });
    };

    // * Format Tx for Ecosystem
    const formatTransactionForSign = (transaction, txParams = {}) => {
        if (!mainAdapter.value) {
            return null;
        }

        const { ecosystem, ...params } = txParams || {};

        if (!ecosystem) {
            return mainAdapter.value.formatTransactionForSign(transaction, params);
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return adapter.formatTransactionForSign(transaction, params);
    };

    // * Prepare Transaction
    const prepareTransaction = async (transaction, { ecosystem }) => {
        if (!mainAdapter.value) {
            return null;
        }

        if (!ecosystem) {
            return await mainAdapter.value.prepareTransaction(transaction);
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        return await adapter.prepareTransaction(transaction);
    };

    // * Get Explorer Link by Tx Hash
    const getTxExplorerLink = (...args) => {
        return mainAdapter.value.getTxExplorerLink(...args) || null;
    };

    // * Get Explorer Link by Tx Hash
    const getTokenExplorerLink = (tokenAddress, chain) => {
        const chains = getChainListByEcosystem(currEcosystem.value);

        if (!chains?.length) {
            return null;
        }

        const chainInfo = chains.find(({ net, bech32_prefix }) => net === chain || bech32_prefix === chain);

        return mainAdapter.value.getTokenExplorerLink(tokenAddress, chainInfo) || null;
    };

    // * Sign & Send Transaction
    const signSend = async (transaction, { ecosystem = null, chain = null }) => {
        if (!ecosystem) {
            return await mainAdapter.value.signSend(transaction);
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (!adapter) {
            return { error: `Please connect your ${ecosystem} wallet` };
        }

        return await adapter.signSend(transaction);
    };

    // * Get Chain List by Ecosystem
    const getChainListByEcosystem = (ecosystem) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        if (!adapter) {
            return [];
        }

        if (!adapter.getChainList) {
            return [];
        }

        return adapter.getChainList(store);
    };

    // * Get Chain by Chain ID
    const getChainByChainId = (ecosystem, chainId) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        const chainList = adapter.getChainList(store);

        const chain = chainList.find((chain) => chain.chain_id === chainId);

        return {
            ...chain,
            chain: chain?.chain_id,
            name: chain?.name,
            logo: chain?.logo,
            ecosystem,
        };
    };

    // * Set New Chain by Ecosystem
    const setNewChain = async (ecosystem, newChainInfo) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        const changed = await adapter.setChain(newChainInfo);

        if (changed) {
            adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);

            return true;
        }

        storeWalletInfo();

        return false;
    };

    // * Get Wallet Logo by Ecosystem
    const getWalletLogo = async (ecosystem, module) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return await adapter.getWalletLogo(module);
    };

    // * Get addressesWithChains by Ecosystem
    const getAddressesWithChainsByEcosystem = async (ecosystem = null, { hash = false } = {}) => {
        if (!ecosystem) {
            return {};
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        const addresses = await adapter.getAddressesWithChains();

        // * Return Hash of Addresses
        if (hash) {
            const hashAddresses = {};

            for (const chain in addresses) {
                hashAddresses[chain] = addresses[chain].address;
            }

            return hashAddresses;
        }

        // * Return Addresses with Logo and Chain Info
        return addresses;
    };

    // * Get Ibc assets for COSMOS ecosystem
    const getIBCAssets = (ecosystem, chain) => {
        if (ecosystem !== ECOSYSTEMS.COSMOS) {
            return [];
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getIBCAssets(chain);
    };

    // * Get Native asset for by Ecosystem and Chain
    const getNativeTokenByChain = (ecosystem, chain, store) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getNativeTokenByChain(chain, store);
    };

    // ==================== HOOKS ====================
    // * Subscribe to Wallets Change
    onMounted(() => {
        subscribeToWalletsChange();
    });

    // * Unsubscribe from Wallets Change
    onBeforeUnmount(() => {
        unsubscribeFromWalletsChange();
    });

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

        formatTransactionForSign,

        setChain,
        setNewChain,

        validateAddress,

        prepareTransaction,
        signSend,

        disconnectWallet,
        disconnectAllWallets,
    };
}

export default useAdapter;
