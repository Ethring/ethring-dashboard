import { computed } from 'vue';

import { useStore } from 'vuex';

import Adapters from '@/Adapter';
import { ECOSYSTEMS } from '@/Adapter/config';

const lastConnectedWallet = computed(() =>
    window.localStorage.getItem('adapter:lastConnectedWallet')
        ? JSON.parse(window.localStorage.getItem('adapter:lastConnectedWallet'))
        : null
);

function useAdapter() {
    const store = useStore();

    const currEcosystem = computed(() => store.getters['adapter/getEcosystem']);

    const connectedWallets = computed(() => store.getters['adapter/getWallets']);
    const walletsModule = computed(() => store.getters['adapter/getWalletsModule']);

    const adapter = computed(() => (currEcosystem.value ? store.getters['adapter/getAdapterByEcosystem'](currEcosystem.value) : null));

    const walletLogo = computed(() => (adapter.value ? adapter.value.getWalletLogo() : null));
    const currentChainInfo = computed(() => (adapter.value ? adapter.value.getCurrentChain(store) : []));
    const walletAddress = computed(() => (adapter.value ? adapter.value.getAccount() : null));

    const chainList = computed(() => (adapter.value ? adapter.value.getChainList(store) : []));

    if (adapter.value?.subscribeToWalletsChange) {
        const wallets = adapter.value?.subscribeToWalletsChange();
        wallets.subscribe(() => {
            storeWalletInfo();
        });
    }

    function initAdapter(ecosystem, chains = []) {
        if (adapter.value && currEcosystem.value === ecosystem) {
            return;
        }

        const availableAdapter = Adapters(ecosystem);

        if (!availableAdapter) {
            return;
        }

        if (chains.length) {
            availableAdapter.reInit(chains);
        }

        store.dispatch('adapter/setAdapter', { adapter: availableAdapter, ecosystem });
        store.dispatch('adapter/setEcosystem', ecosystem);

        return;
    }

    function storeWalletInfo() {
        const walletInfo = {
            address: walletAddress.value,
            chain: currentChainInfo.value?.chainName || currentChainInfo.value?.chain_id,
            ecosystem: currEcosystem.value,
            walletName: currentChainInfo.value?.walletPrettyName || currentChainInfo.value?.walletName,
            walletModule: currentChainInfo.value?.walletModule || currentChainInfo.value?.walletName,
        };

        if (!walletInfo.address || !walletInfo.walletName || !walletInfo.chain) {
            return;
        }

        store.dispatch('adapter/setWallet', walletInfo);
    }

    const connectLastConnectedWallet = async () => {
        if (!connectedWallets.value || !lastConnectedWallet.value) {
            return;
        }

        const { ecosystem: lastEcosystem } = lastConnectedWallet.value;

        for (const wallet of connectedWallets.value) {
            const { ecosystem, chain, walletModule } = wallet;

            const adapter = store.getters['adapter/getAdapterByEcosystem'](ecosystem);

            if (lastEcosystem === ecosystem) {
                store.dispatch('adapter/setEcosystem', ecosystem);
            }

            adapter.connectWallet(walletModule, chain);
        }
    };

    const connectWallet = async (...args) => {
        const status = await adapter.value.connectWallet(...args);

        if (status) {
            storeWalletInfo();
        }

        return status;
    };

    const connectTo = async (ecosystem, ...args) => {
        const adapter = store.getters['adapter/getAdapterByEcosystem'](ecosystem);

        const status = await adapter.connectWallet(...args);

        if (status) {
            store.dispatch('adapter/setEcosystem', ecosystem);
            storeWalletInfo();
        }

        return status;
    };

    const getWalletsModule = (ecosystem) => {
        const adapter = store.getters['adapter/getAdapterByEcosystem'](ecosystem);
        const modules = adapter?.getMainWallets();
        if (modules) {
            store.dispatch('adapter/setWalletsModule', modules);
        }
    };

    const setChain = (...args) => {
        return adapter.value.setChain(...args);
    };

    const disconnectAllWallets = async (...args) => {
        for (const ecosystem in ECOSYSTEMS) {
            const adapter = store.getters['adapter/getAdapterByEcosystem'](ecosystem);
            console.log('disconnecting from', ecosystem, adapter);
            await adapter.disconnectAllWallets(...args);
        }
        store.dispatch('adapter/disconnectAll');
    };

    const validateAddress = (address) => {
        if (!adapter.value) {
            return false;
        }
        const validation = currentChainInfo.value.address_validating || currentChainInfo.value.bech32_prefix;

        return adapter.value.validateAddress(address, validation);
    };

    const prepareTransaction = async (...args) => {
        console.log('prepareTransaction', ...args);
        return await adapter.value.prepareTransaction(...args);
    };

    const signSend = async (transaction) => {
        return await adapter.value.signSend(transaction);
    };

    return {
        walletAddress,
        walletLogo,

        walletsModule,

        currentChainInfo,
        connectedWallets,
        chainList,

        initAdapter,

        connectTo,
        connectWallet,
        connectLastConnectedWallet,

        getWalletsModule,
        setChain,

        validateAddress,

        prepareTransaction,
        signSend,

        disconnectAllWallets,
    };
}

export default useAdapter;
