<template>
    <a-config-provider>
        <LoadingOverlay v-if="isConnecting" />
        <div class="app-wrap" :class="{ 'lock-scroll': isOpen }">
            <Sidebar />
            <NavBar />

            <div class="app-wrap__layout">
                <div>
                    <router-view />
                </div>
            </div>
        </div>
        <WalletsModal />
        <AddressModal />
    </a-config-provider>
</template>

<script>
import { onMounted, onUpdated, onBeforeMount, watch, ref, computed } from 'vue';
import { useStore } from 'vuex';

import useInit from '@/compositions/useInit';
import useAdapter from '@/Adapter/compositions/useAdapter';

import WalletsModal from '@/Adapter/UI/Modal/WalletsModal';
import AddressModal from '@/Adapter/UI/Modal/AddressModal';

import NavBar from '@/components/app/NavBar';
import Sidebar from '@/components/app/Sidebar';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default {
    name: 'App',
    components: {
        Sidebar,
        NavBar,
        WalletsModal,
        AddressModal,
        LoadingOverlay,
    },

    setup() {
        const store = useStore();
        
        const lastConnectedCall = ref(false);

        const {
            isConnecting,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
        } = useAdapter();

        const isOpen = computed(() => store.getters['adapters/isOpen']('wallets'));

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value) {
                return;
            }

            const addressesWithChains = getAddressesWithChainsByEcosystem(ecosystem);

            await useInit(store, { account: walletAccount.value, addressesWithChains, currentChainInfo: currentChainInfo.value });
        };

        onBeforeMount(async () => await store.dispatch('networks/initZometNets'));

        onMounted(async () => {
            !lastConnectedCall.value && connectLastConnectedWallet().then(() => (lastConnectedCall.value = true));
            await callInit();
        });

        watch(walletAccount, async () => await callInit());

        onUpdated(async () => await callInit());

        return {
            isOpen,
            isConnecting,
        };
    },
};
</script>

<style lang="scss" scoped>
.app-wrap.lock-scroll {
    overflow: hidden;
}
</style>
