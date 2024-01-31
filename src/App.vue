<template>
    <a-config-provider>
        <AppLayout />
        <WalletsModal />
        <AddressModal />
        <RoutesModal />
        <KadoModal />
        <ReleaseNotes />
    </a-config-provider>
</template>
<script>
import { onMounted, watch, ref, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

import useInit from '@/compositions/useInit/';
import { ECOSYSTEMS } from '@/Adapter/config';

import Socket from './modules/Socket';

import AppLayout from './layouts/DefaultLayout/AppLayout.vue';

import WalletsModal from '@/Adapter/UI/Modal/WalletsModal';
import AddressModal from '@/Adapter/UI/Modal/AddressModal';
import KadoModal from './components/app/modals/KadoModal.vue';
import RoutesModal from './components/app/modals/RoutesModal.vue';

import ReleaseNotes from './layouts/DefaultLayout/header/ReleaseNotes.vue';

import { delay } from '@/shared/utils/helpers';

export default {
    name: 'App',
    components: {
        AppLayout,
        KadoModal,
        RoutesModal,
        ReleaseNotes,
        WalletsModal,
        AddressModal,
    },

    setup() {
        const useAdapter = inject('useAdapter');
        const store = useStore();

        const lastConnectedCall = ref(false);

        const isInitCall = ref({});

        const isConfigLoading = computed({
            get: () => store.getters['networks/isConfigLoading'],
            set: (value) => store.dispatch('networks/setConfigLoading', value),
        });

        const {
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
            getChainListByEcosystem,
            getIBCAssets,
            // getNativeTokenByChain,
        } = useAdapter();

        const isOpen = computed(() => store.getters['adapters/isOpen']('wallets'));

        const isShowRoutesModal = computed(() => store.getters['app/modal']('routesModal'));

        const callSubscription = async () => {
            const { ecosystem } = currentChainInfo.value || {};

            if (!ecosystem) {
                return;
            }

            await delay(1000);

            const addressesWithChains = getAddressesWithChainsByEcosystem(ecosystem);

            if (JSON.stringify(addressesWithChains) !== '{}') {
                Socket.setAddresses(addressesWithChains, walletAddress.value, ecosystem);
            }
        };

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || isShowRoutesModal.value) {
                return setTimeout(callInit, 1000);
            }

            isConfigLoading.value = true;

            await store.dispatch('networks/initZometNets', ecosystem.toLowerCase());

            if (isInitCall.value[walletAccount.value]) {
                return;
            }

            store.dispatch('tokens/setLoader', true);

            isInitCall.value = {
                ...isInitCall.value,
                [walletAccount.value]: true,
            };

            await delay(1000);

            const addressesWithChains = getAddressesWithChainsByEcosystem(ecosystem);

            await useInit(store, { account: walletAccount.value, addressesWithChains, currentChainInfo: currentChainInfo.value });
        };

        // ==========================================================================================

        const unWatchAcc = watch(walletAccount, async () => {
            await callInit();
            await callSubscription();
        });

        // ==========================================================================================

        onBeforeMount(async () => {
            await store.dispatch('bridgeDex/getServices');
        });

        onMounted(async () => {
            const chains = getChainListByEcosystem(ECOSYSTEMS.COSMOS);

            for (const { chain_name } of chains) {
                store.dispatch('networks/setTokensByCosmosNet', {
                    network: chain_name,
                    tokens: getIBCAssets(ECOSYSTEMS.COSMOS, chain_name),
                });
            }

            Socket.init();

            store.dispatch('tokens/setLoader', true);

            if (!lastConnectedCall.value) {
                await connectLastConnectedWallet();
                lastConnectedCall.value = true;
            }

            if (!lastConnectedCall.value) {
                store.dispatch('tokens/setLoader', false);
            }

            await delay(300);

            if (currentChainInfo.value) {
                await callInit();
            }
        });

        onBeforeUnmount(() => {
            // Stop watching
            unWatchAcc();
        });

        return {
            isOpen,
        };
    },
};
</script>

<style lang="scss" scoped>
.app-wrap.lock-scroll {
    overflow: hidden;
}

.sidebar {
    background: var(--zmt-primary);
}

.header {
    width: 75%;
    margin: 0 auto;

    height: 48px;
    padding: 0;

    position: sticky;
    top: 0;
    z-index: 100;

    background-color: var(--#{$prefix}nav-bar-bg-color);
}
</style>
