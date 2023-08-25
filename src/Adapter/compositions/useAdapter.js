import Adapters from '@/Adapter';

import { ref, computed } from 'vue';

import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';

const lastConnectedWallet = computed(() =>
    window.localStorage.getItem('adapter:lastConnectedWallet')
        ? JSON.parse(window.localStorage.getItem('adapter:lastConnectedWallet'))
        : null
);

const STORE_ACTIONS = {
    SET_ECOSYSTEM: 'adapter/setEcosystem',
    SET_WALLET: 'adapter/setWallet',
    SET_WALLETS_MODULE: 'adapter/setWalletsModule',
    DISCONNECT_ALL_WALLETS: 'adapter/disconnectAll',
    SET_IS_CONNECTING: 'adapter/setIsConnecting',
};

const STORE_GETTERS = {
    GET_WALLETS: 'adapter/getWallets',
    GET_WALLETS_MODULE: 'adapter/getWalletsModule',
    GET_ECOSYSTEM: 'adapter/getEcosystem',
    GET_ADAPTER_BY_ECOSYSTEM: 'adapter/getAdapterByEcosystem',
};

function initAdapter(ecosystem, chains = []) {
    const adapter = Adapters(ecosystem);

    if (chains.length > 0) {
        adapter.reInit(chains);
    }
}

function useAdapter() {
    const store = useStore();

    const forceUpdate = ref(false);

    const currEcosystem = computed(() => {
        forceUpdate.value;
        return store.getters[STORE_GETTERS.GET_ECOSYSTEM];
    });

    const mainAdapter = computed(() => {
        forceUpdate.value;
        return currEcosystem.value ? store.getters[STORE_GETTERS.GET_ADAPTER_BY_ECOSYSTEM](currEcosystem.value) : null;
    });

    const connectedWallets = computed(() => store.getters[STORE_GETTERS.GET_WALLETS]);

    const walletsModule = computed(() => store.getters[STORE_GETTERS.GET_WALLETS_MODULE]);

    const currentChainInfo = computed(() => (mainAdapter.value ? mainAdapter.value.getCurrentChain(store) : []));

    const walletAddress = computed(() => {
        forceUpdate.value;
        return mainAdapter.value ? mainAdapter.value.getAccountAddress() : null;
    });

    const walletAccount = computed(() => {
        forceUpdate.value;
        return mainAdapter.value ? mainAdapter.value.getAccount() : null;
    });

    const connectedWalletModule = computed(() => {
        forceUpdate.value;
        return mainAdapter.value ? mainAdapter.value.getWalletModule() : null;
    });

    const connectedWallet = computed(() => {
        forceUpdate.value;
        return mainAdapter.value ? mainAdapter.value.getConnectedWallet() : null;
    });

    const chainList = computed(() => (mainAdapter.value ? mainAdapter.value.getChainList(store) : []));

    function subscribeToWalletsChange() {
        if (!mainAdapter.value?.subscribeToWalletsChange) {
            return;
        }

        store.dispatch(STORE_ACTIONS.SET_IS_CONNECTING, false);

        const wallets = mainAdapter.value?.subscribeToWalletsChange();

        if (!wallets) {
            return;
        }

        return wallets.subscribe(async () => {
            forceUpdate.value = true;
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (mainAdapter.value?.updateStates) {
                await mainAdapter.value?.updateStates();
            }
            storeWalletInfo();
            forceUpdate.value = false;
        });
    }

    function storeWalletInfo() {
        forceUpdate.value = true;

        const walletInfo = {
            account: mainAdapter.value?.getAccount(),
            address: mainAdapter.value?.getAccountAddress(),
            chain: currentChainInfo.value?.chainName || currentChainInfo.value?.chain_id,
            ecosystem: currEcosystem.value,
            walletName: currentChainInfo.value?.walletPrettyName || currentChainInfo.value?.walletName,
            walletModule: connectedWalletModule.value,
        };

        if (!walletInfo.address || !walletInfo.walletName || !walletInfo.chain) {
            return;
        }

        store.dispatch(STORE_ACTIONS.SET_WALLET, walletInfo);

        forceUpdate.value = false;

        store.dispatch(STORE_ACTIONS.SET_IS_CONNECTING, false);

        subscribeToWalletsChange();
    }

    const connectLastConnectedWallet = async () => {
        if (!lastConnectedWallet.value || walletAddress.value) {
            return;
        }

        const { ecosystem, chain, walletModule } = lastConnectedWallet.value;

        const lwAdapter = Adapters(ecosystem);
        store.dispatch(STORE_ACTIONS.SET_IS_CONNECTING, true);

        await lwAdapter.connectWallet(walletModule, chain);

        store.dispatch(STORE_ACTIONS.SET_ECOSYSTEM, ecosystem);

        return subscribeToWalletsChange();
    };

    const connectWallet = async (...args) => {
        store.dispatch(STORE_ACTIONS.SET_IS_CONNECTING, true);
        const status = await mainAdapter.value.connectWallet(...args);

        status && storeWalletInfo();

        return status;
    };

    const connectTo = async (ecosystem, ...args) => {
        store.dispatch(STORE_ACTIONS.SET_IS_CONNECTING, true);

        const adapter = Adapters(ecosystem);

        const status = await adapter.connectWallet(...args);

        if (status) {
            store.dispatch(STORE_ACTIONS.SET_ECOSYSTEM, ecosystem);
            storeWalletInfo();
        }

        return status;
    };

    const getWalletsModule = (ecosystem) => {
        const adapter = Adapters(ecosystem);
        const modules = adapter.getMainWallets();

        if (modules) {
            store.dispatch(STORE_ACTIONS.SET_WALLETS_MODULE, modules);
        }
    };

    const setChain = (...args) => {
        return mainAdapter.value.setChain(...args);
    };

    const disconnectAllWallets = async (...args) => {
        for (const ecosystem in ECOSYSTEMS) {
            const adapter = Adapters(ecosystem);
            await adapter.disconnectAllWallets(...args);
        }
        store.dispatch(STORE_ACTIONS.DISCONNECT_ALL_WALLETS);
    };

    const validateAddress = (address) => {
        if (!mainAdapter.value) {
            return false;
        }

        const validation = currentChainInfo.value.address_validating || currentChainInfo.value.bech32_prefix;

        return mainAdapter.value.validateAddress(address, validation);
    };

    const prepareTransaction = async (...args) => {
        return await mainAdapter.value.prepareTransaction(...args);
    };

    const signSend = async (transaction) => {
        return await mainAdapter.value.signSend(transaction);
    };

    const getChainListByEcosystem = (ecosystem) => {
        const adapter = Adapters(ecosystem);
        return adapter.getChainList(store);
    };

    const getChainByChainId = (ecosystem, chainId) => {
        const adapter = Adapters(ecosystem);
        const chainList = adapter.getChainList(store);
        const chain = chainList.find((chain) => chain.chain_id === chainId);

        return {
            chain: chain?.chain_id,
            name: chain?.name,
            logo: chain?.logo,
        };
    };

    const setNewChain = async (ecosystem, newChainInfo) => {
        const adapter = Adapters(ecosystem);
        await adapter.setChain(newChainInfo);

        store.dispatch(STORE_ACTIONS.SET_ECOSYSTEM, ecosystem);

        storeWalletInfo();
    };

    const getWalletLogo = async (ecosystem, module) => {
        const adapter = Adapters(ecosystem);
        return await adapter.getWalletLogo(module);
    };

    return {
        connectedWallet,

        walletAccount,
        walletAddress,

        walletsModule,

        currentChainInfo,
        connectedWallets,
        chainList,

        initAdapter,
        subscribeToWalletsChange,

        connectTo,
        connectWallet,
        connectLastConnectedWallet,

        getWalletLogo,
        getWalletsModule,
        getChainListByEcosystem,
        getChainByChainId,

        setChain,
        setNewChain,

        validateAddress,

        prepareTransaction,
        signSend,

        disconnectAllWallets,
    };
}

export default useAdapter;
