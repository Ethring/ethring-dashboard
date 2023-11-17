import { computed } from 'vue';
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
        adaptersDispatch(TYPES.SET_IS_CONNECTED, true);

        return subscribeToWalletsChange();
    }

    // * Connect to Wallet by Ecosystem
    const connectTo = async (ecosystem, ...args) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);

        try {
            const { isConnected, walletName } = await adapter.connectWallet(...args);

            adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

            if (walletName) {
                adaptersDispatch(TYPES.SWITCH_ECOSYSTEM, ecosystem);
                adaptersDispatch(TYPES.SET_IS_CONNECTED, true);
            }

            isConnected && storeWalletInfo();

            return isConnected;
        } catch (error) {
            console.error('Failed to connect to:', ecosystem, error);
            adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
            adaptersDispatch(TYPES.SET_IS_CONNECTED, false);
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

        try {
            adaptersDispatch(TYPES.SET_IS_CONNECTING, true);

            const isConnect = await connectTo(ecosystem, walletModule, chain);

            if (!isConnect) {
                console.warn('Failed to connect to last connected wallet', ecosystem, chain, walletModule);
                adaptersDispatch(TYPES.SET_IS_CONNECTING, false);
                adaptersDispatch(TYPES.SET_IS_CONNECTED, false);
                return router.push('/connect-wallet');
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
    const formatTransactionForSign = (transaction) => {
        if (!mainAdapter.value) {
            return null;
        }

        return mainAdapter.value.formatTransactionForSign(transaction);
    };

    // * Prepare Transaction
    const prepareTransaction = async (...args) => {
        return await mainAdapter.value.prepareTransaction(...args);
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

        const chainInfo = chains.find(({ net }) => net === chain);

        return mainAdapter.value.getTokenExplorerLink(tokenAddress, chainInfo) || null;
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
    const getAddressesWithChainsByEcosystem = (ecosystem) => {
        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getAddressesWithChains();
    };

    // * Get Ibc assets for COSMOS ecosystem
    const getIBCAssets = (ecosystem, chain) => {
        if (ecosystem !== ECOSYSTEMS.COSMOS) {
            return [];
        }

        const adapter = adaptersGetter(GETTERS.ADAPTER_BY_ECOSYSTEM)(ecosystem);
        return adapter.getIBCAssets(chain);
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
        getTokenExplorerLink,
        getIBCAssets,

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
