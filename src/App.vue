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
import { onMounted, onBeforeMount, watch } from 'vue';
import { useStore } from 'vuex';

import { ECOSYSTEMS } from '@/Adapter/config';
import WalletsModal from '@/Adapter/UI/Modal/WalletsModal.vue';

import useInit from '@/compositions/useInit';
import useAdapter from '@/compositions/useAdapter';

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

        const callInit = async () => {
            if (walletAddress.value) {
                await useInit(walletAddress.value, store);
            }
        };

        onBeforeMount(async () => {
            store.dispatch('networks/initZometNets');

            initAdapter(ECOSYSTEMS.EVM);
            initAdapter(ECOSYSTEMS.COSMOS);

            await connectLastConnectedWallet();
            await callInit();
        });

        watch(walletAddress, async () => await callInit());
        onMounted(async () => await callInit());
    },
};
</script>
