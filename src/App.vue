<template>
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
</template>

<script>
import { onMounted, onUpdated, onBeforeMount, watch, ref, computed } from 'vue';
import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';
import WalletsModal from '@/Adapter/UI/Modal/WalletsModal.vue';

import useInit from '@/compositions/useInit';
import useAdapter from '@/Adapter/compositions/useAdapter';

import NavBar from '@/components/app/NavBar';
import Sidebar from '@/components/app/Sidebar';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

export default {
    name: 'App',
    components: {
        Sidebar,
        NavBar,
        WalletsModal,
        LoadingOverlay,
    },

    setup() {
        const store = useStore();
        const lastConnectedCall = ref(false);
        const isOpen = computed(() => store.getters['adapter/isOpen']);
        const isConnecting = computed(() => store.getters['adapter/isConnecting']);

        const { initAdapter, walletAddress, walletAccount, currentChainInfo, connectLastConnectedWallet } = useAdapter();

        const EVM_CHAINS = computed(() => store.getters['networks/chainsForConnect']);

        const callInit = async () => {
            if (!currentChainInfo.value || !currentChainInfo.value?.walletModule || !walletAddress.value) {
                return;
            }
            await useInit(currentChainInfo.value.ecosystem, walletAddress.value, store);
        };

        onBeforeMount(async () => {
            store.dispatch('adapter/initializeAdapter', ECOSYSTEMS.COSMOS);
            store.dispatch('adapter/initializeAdapter', ECOSYSTEMS.EVM);
            await Promise.all([store.dispatch('networks/initBlocknativeChains'), store.dispatch('networks/initZometNets')]);
        });

        onMounted(async () => {
            // wait while EVM_CHAINS value is empty
            while (!EVM_CHAINS.value.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            initAdapter(ECOSYSTEMS.EVM, EVM_CHAINS.value);
            initAdapter(ECOSYSTEMS.COSMOS);

            !lastConnectedCall.value && connectLastConnectedWallet().then(() => (lastConnectedCall.value = true));

            await callInit();
        });

        watch(walletAddress, async () => await callInit());

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
