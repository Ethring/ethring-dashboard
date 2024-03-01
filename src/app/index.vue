<template>
    <KeepAlive>
        <a-config-provider>
            <AppLayout />
            <WalletsModal />
            <AddressModal />
            <BridgeDexRoutesModal />
            <KadoModal />
            <ReleaseNotes />
        </a-config-provider>
    </KeepAlive>
</template>
<script>
import { onMounted, watch, computed, inject, onBeforeMount, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

import Socket from '@/app/modules/socket';

import AppLayout from '@/app/layouts/DefaultLayout';
import ReleaseNotes from '@/app/layouts/DefaultLayout/header/ReleaseNotes.vue';

import WalletsModal from '@/Adapter/UI/Modal/WalletsModal';
import AddressModal from '@/Adapter/UI/Modal/AddressModal';
import KadoModal from '@/components/app/modals/KadoModal.vue';
// import RoutesModal from '@/components/app/modals/RoutesModal.vue';
import BridgeDexRoutesModal from '@/components/app/modals/BridgeDexRoutesModal.vue';

import { updateBalanceForAccount } from '@/modules/balance-provider';

import { trackingBalanceUpdate } from '@/services/track-update-balance';
import { setNativeTokensPrices } from '../modules/balance-provider/native-token';

export default {
    name: 'App',
    components: {
        AppLayout,
        KadoModal,
        BridgeDexRoutesModal,
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

        const addressesWithChains = computed(async () => {
            const { ecosystem } = currentChainInfo.value || {};
            return (await getAddressesWithChainsByEcosystem(ecosystem)) || {};
        });

        const addressByChain = computed(async () => {
            const { ecosystem } = currentChainInfo.value || {};
            return (await getAddressesWithChainsByEcosystem(ecosystem, { hash: true })) || {};
        });

        const callSubscription = async () => {
            const { ecosystem } = currentChainInfo.value || {};

            if (JSON.stringify(await addressesWithChains.value) !== '{}' && walletAddress.value) {
                Socket.setAddresses(await addressesWithChains.value, walletAddress.value, ecosystem);
            }
        };

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || isShowRoutesModal.value) {
                store.dispatch('tokens/setLoader', false);
                return setTimeout(callInit, 1000);
            }

            const addresses = await addressesWithChains.value;
            const addressHash = await addressByChain.value;

            await setNativeTokensPrices(store, ecosystem);
            await updateBalanceForAccount(walletAccount.value, addresses);

            store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM', { ecosystem, addresses: addressHash });
            store.dispatch('adapters/SET_ADDRESSES_BY_ECOSYSTEM_LIST', { ecosystem, addresses });
        };

        // ==========================================================================================

        const unWatchAcc = watch(walletAccount, async () => {
            store.dispatch('tokens/setLoader', true);
            store.dispatch('tokens/setTargetAccount', walletAccount.value);
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
            // await store.dispatch('bridgeDex/getServices');
            await store.dispatch('bridgeDexAPI/getServices');

            await initAdapter();
        });

        onBeforeUnmount(() => {
            // Stop watching
            unWatchAcc();
            unWatchLoading();
        });

        // ==========================================================================================
        // * Tracking balance update for all accounts
        onMounted(() => {
            // * Tracking balance update for all accounts
            trackingBalanceUpdate(store);
        });
    },
};
</script>
