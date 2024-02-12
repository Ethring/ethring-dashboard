<template>
    <KeepAlive>
        <a-config-provider>
            <AppLayout />
            <WalletsModal />
            <AddressModal />
            <RoutesModal />
            <KadoModal />
            <ReleaseNotes />
        </a-config-provider>
    </KeepAlive>
</template>
<script>
import { onMounted, watch, ref, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

// import useInit from '@/compositions/useInit/';

import Socket from '@/app/modules/socket';

import AppLayout from '@/app/layouts/DefaultLayout';
import ReleaseNotes from '@/app/layouts/DefaultLayout/header/ReleaseNotes.vue';

import WalletsModal from '@/Adapter/UI/Modal/WalletsModal';
import AddressModal from '@/Adapter/UI/Modal/AddressModal';
import KadoModal from '@/components/app/modals/KadoModal.vue';
import RoutesModal from '@/components/app/modals/RoutesModal.vue';

// import { delay } from '@/shared/utils/helpers';
import { updateBalanceForAccount } from '@/modules/balance-provider';

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

        const isConfigLoading = computed(() => store.getters['configs/isConfigLoading']);

        const {
            initAdapter,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
        } = useAdapter();

        const isShowRoutesModal = computed(() => store.getters['app/modal']('routesModal'));

        const addressesWithChains = computed(() => {
            const { ecosystem } = currentChainInfo.value || {};
            return getAddressesWithChainsByEcosystem(ecosystem) || {};
        });

        const callSubscription = () => {
            console.log('callSubscription', walletAddress.value);
            const { ecosystem } = currentChainInfo.value || {};

            if (JSON.stringify(addressesWithChains.value) !== '{}' && walletAddress.value) {
                Socket.setAddresses(addressesWithChains.value, walletAddress.value, ecosystem);
            }
        };

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || isShowRoutesModal.value) {
                store.dispatch('tokens/setLoader', false);
                return setTimeout(callInit, 1000);
            }

            await updateBalanceForAccount(walletAccount.value, addressesWithChains.value);
        };

        // ==========================================================================================

        const unWatchAcc = watch(walletAccount, async () => {
            store.dispatch('tokens/setLoader', true);
            callSubscription();
            await callInit();
        });

        const unWatchLoading = watch(isConfigLoading, async () => {
            if (!isConfigLoading.value) {
                await connectLastConnectedWallet();
            }
        });

        // ==========================================================================================

        onBeforeMount(async () => {
            await store.dispatch('configs/setConfigLoading', true);

            await store.dispatch('configs/initConfigs');
            await store.dispatch('bridgeDex/getServices');

            await initAdapter();
        });

        onBeforeUnmount(() => {
            // Stop watching
            unWatchAcc();
            unWatchLoading();
        });
    },
};
</script>
