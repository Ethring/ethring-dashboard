<template>
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
import { onMounted, onUpdated, onBeforeMount, watch, computed } from 'vue';
import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';
import WalletsModal from '@/Adapter/UI/Modal/WalletsModal.vue';

import useInit from '@/compositions/useInit';
import useAdapter from '@/Adapter/compositions/useAdapter';

import NavBar from '@/components/app/NavBar';
import Sidebar from '@/components/app/Sidebar';

export default {
    name: 'App',
    components: {
        Sidebar,
        NavBar,
        WalletsModal,
    },

    setup() {
        const store = useStore();
        const isOpen = computed(() => store.getters['adapter/isOpen']);

        const { initAdapter, walletAddress, currentChainInfo, connectLastConnectedWallet } = useAdapter();
        const EVM_CHAINS = computed(() => store.getters['networks/chainsForConnect']);

        const callInit = async () => {
            if ((currentChainInfo.value && walletAddress.value !== undefined) || walletAddress.value !== null) {
                await useInit(currentChainInfo.value.ecosystem, walletAddress.value, store);
            }
        };

        onBeforeMount(async () => {
            await Promise.all([store.dispatch('networks/initBlocknativeChains'), store.dispatch('networks/initZometNets')]);
        });

        onMounted(async () => {
            // wait while EVM_CHAINS value is empty
            while (!EVM_CHAINS.value.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            initAdapter(ECOSYSTEMS.COSMOS);
            initAdapter(ECOSYSTEMS.EVM, EVM_CHAINS.value);

            await Promise.all([connectLastConnectedWallet(), callInit()]);
        });

        watch(walletAddress, async () => await callInit());

        onUpdated(async () => await callInit());

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
</style>
