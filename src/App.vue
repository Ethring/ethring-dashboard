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
            get: () => store.getters['configs/isConfigLoading'],
            set: (value) => store.dispatch('configs/setConfigLoading', value),
        });

        const {
            initAdapter,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
        } = useAdapter();

        const isShowRoutesModal = computed(() => store.getters['app/modal']('routesModal'));

        const callSubscription = async () => {
            console.log('callSubscription');
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

        const unWatchLoading = watch(isConfigLoading, async () => {
            if (!isConfigLoading.value && !lastConnectedCall.value) {
                await connectLastConnectedWallet();
                lastConnectedCall.value = true;
            }
        });

        // ==========================================================================================

        onBeforeMount(async () => {
            isConfigLoading.value = true;

            await store.dispatch('configs/initConfigs');

            await initAdapter();

            await store.dispatch('bridgeDex/getServices');
        });

        onMounted(async () => {
            store.dispatch('tokens/setLoader', true);

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
            unWatchLoading();
        });
    },
};
</script>
