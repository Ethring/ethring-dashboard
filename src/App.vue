<template>
    <div class="app-wrap">
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

        const { initAdapter, walletAddress, connectLastConnectedWallet } = useAdapter();
        const EVM_CHAINS = computed(() => store.getters['networks/chainsForConnect']);

        const callInit = async () => {
            if (walletAddress.value !== undefined) {
                await useInit(walletAddress.value, store);
            }
        };

        onBeforeMount(async () => {
            const storePromises = [store.dispatch('networks/initBlocknativeChains'), store.dispatch('networks/initZometNets')];
            await Promise.all(storePromises);
            await Promise.all([connectLastConnectedWallet(), callInit()]);
        });

        onMounted(() => {
            initAdapter(ECOSYSTEMS.EVM, EVM_CHAINS.value);
            initAdapter(ECOSYSTEMS.COSMOS);
        });

        watch(walletAddress, async () => await callInit());

        onUpdated(async () => {
            console.log('onUpdated');
            await callInit();
        });
    },
};
</script>
