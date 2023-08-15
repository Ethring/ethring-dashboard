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

    if (adapter.value?.subscribeToWalletsChange) {
        const wallets = adapter.value?.subscribeToWalletsChange();
        wallets.subscribe(() => {
            storeWalletInfo();
        });
    }

    function initAdapter(ecosystem) {
        if (adapter.value && currEcosystem.value === ecosystem) {
            return;
        }

        const availableAdapter = Adapters(ecosystem);

        if (!availableAdapter) {
            return;
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

    const disconnectAllWallets = async (...args) => {
        for (const ecosystem in ECOSYSTEMS) {
            const adapter = store.getters['adapter/getAdapterByEcosystem'](ecosystem);
            console.log('disconnecting from', ecosystem, adapter);
            await adapter.disconnectAllWallets(...args);
        }
        store.dispatch('adapter/disconnectAll');
    };

    return {
        walletAddress,
        walletLogo,

        walletsModule,

        currentChainInfo,
        connectedWallets,

        initAdapter,

        connectTo,
        connectWallet,
        connectLastConnectedWallet,

        getWalletsModule,

        disconnectAllWallets,
    };
}

export default useAdapter;
