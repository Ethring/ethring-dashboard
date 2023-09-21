// import EcosystemAdapter from '@/Adapter/ecosystems';

import { computed } from 'vue';
import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';

import * as GETTERS from '../store/getters';
import * as TYPES from '../store/types';

function useAdapter() {
    // * Store Module
    const store = useStore();
    const storeModule = 'adapters';

    // * Store Getters & Dispatch
    const adaptersGetter = (getter) => store.getters[`${storeModule}/${getter}`];
    const adaptersDispatch = (dispatch, ...args) => store.dispatch(`${storeModule}/${dispatch}`, ...args);

    // * Last Connected Wallet
    const lastConnectedWallet = computed(() => adaptersGetter(GETTERS.LAST_CONNECTED_WALLET));

    const currEcosystem = computed(() => adaptersGetter(GETTERS.CURRENT_ECOSYSTEM));

    // * Main Adapter for current ecosystem
    const mainAdapter = computed(() => adaptersGetter(GETTERS.CURRENT_ADAPTER));

    // * Main Variables
    const isConnecting = computed(() => adaptersGetter(GETTERS.IS_CONNECTING));

    const connectedWallets = computed(() => adaptersGetter(GETTERS.CONNECTED_WALLETS));
    const currentChainInfo = computed(() => (mainAdapter.value ? mainAdapter.value.getCurrentChain(store) : []));

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

        return wallets.subscribe(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (mainAdapter.value?.updateStates) {
                await mainAdapter.value?.updateStates();
            }

            storeWalletInfo();
        });
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

        if (!walletInfo.address || !walletInfo.walletName || !walletInfo.chain) {
            return;
        }

        adaptersDispatch(TYPES.SET_WALLET, { ecosystem: currEcosystem.value, wallet: walletInfo });
        adaptersDispatch(TYPES.SET_IS_CONNECTING, false);

        return subscribeToWalletsChange();
    }

    // * Connect to Wallet by Ecosystem
    const connectTo = async (ecosystem, ...args) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        try {
            const isConnected = await adapter.connectWallet(...args);

            adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

            adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);

            isConnected && storeWalletInfo();

            return isConnected;
        } catch (error) {
            console.error('Failed to connect to:', ecosystem, error);
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            return false;
        }
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

        adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

        for (const wallet of connectedWallets.value) {
            if (wallet.id === lastConnectedWallet.value.id) {
                continue;
            }

            await connectTo(wallet.ecosystem, wallet.walletModule, wallet.chain);
        }

        const isConnect = await connectTo(ecosystem, walletModule, chain);

        if (!isConnect) {
            return adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
        }

        return subscribeToWalletsChange();
    };

    // * Get Wallets Module by Ecosystem
    const getWalletsModuleByEcosystem = (ecosystem) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getMainWallets() || [];
    };

    // * Set Chain for current ecosystem
    const setChain = (...args) => mainAdapter.value.setChain(...args);

    // * Disconnect Wallet by Ecosystem
    const disconnectWallet = async (ecosystem, wallet) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        adaptersDispatch(TYPES.DISCONNECT_WALLET, wallet);
        await adapter.disconnectWallet(wallet.walletModule);
    };

    // * Disconnect All Wallets
    const disconnectAllWallets = async (...args) => {
        for (const ecosystem in ECOSYSTEMS) {
            const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
            await adapter.disconnectAllWallets(...args);
        }

        adaptersDispatch(TYPES.DISCONNECT_ALL_WALLETS);
    };

    // * Validate Address
    const validateAddress = (address) => {
        if (!mainAdapter.value) {
            return false;
        }

        const validation = currentChainInfo.value.address_validating || currentChainInfo.value.bech32_prefix;

        return mainAdapter.value.validateAddress(address, validation);
    };

    // * Prepare Transaction
    const prepareTransaction = async (...args) => {
        return await mainAdapter.value.prepareTransaction(...args);
    };

    // * Get Explorer Link by Tx Hash
    const getTxExplorerLink = (...args) => {
        return mainAdapter.value.getTxExplorerLink(...args);
    };

    // * Sign & Send Transaction
    const signSend = async (transaction) => {
        return await mainAdapter.value.signSend(transaction);
    };

    // * Get Chain List by Ecosystem
    const getChainListByEcosystem = (ecosystem) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getChainList(store);
    };

    // * Get Chain by Chain ID
    const getChainByChainId = (ecosystem, chainId) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        const chainList = adapter.getChainList(store);
        const chain = chainList.find((chain) => chain.chain_id === chainId);

        return {
            chain: chain?.chain_id,
            name: chain?.name,
            logo: chain?.logo,
        };
    };

    // * Set New Chain by Ecosystem
    const setNewChain = async (ecosystem, newChainInfo) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        await adapter.setChain(newChainInfo);

        adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);

        storeWalletInfo();
    };

    // * Get Wallet Logo by Ecosystem
    const getWalletLogo = async (ecosystem, module) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return await adapter.getWalletLogo(module);
    };

    // * Get addressesWithChains by Ecosystem
    const getAddressesWithChainsByEcosystem = (ecosystem) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getAddressesWithChains();
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

        action: (action, ...args) => adaptersDispatch(TYPES[action], ...args),

        connectTo,
        connectLastConnectedWallet,

        getWalletLogo,
        getWalletsModuleByEcosystem,
        getAddressesWithChainsByEcosystem,
        getChainListByEcosystem,
        getChainByChainId,

        getTxExplorerLink,

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
