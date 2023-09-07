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
    </a-config-provider>
</template>

<script>
import { onMounted, onUpdated, onBeforeMount, watch, ref, computed } from 'vue';
import { useStore } from 'vuex';

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

        const isOpen = computed(() => store.getters['adapters/isOpen']);

        const { isConnecting, walletAddress, walletAccount, currentChainInfo, connectLastConnectedWallet } = useAdapter();

        const callInit = async () => {
            if (!currentChainInfo.value || !currentChainInfo.value?.walletModule || !walletAddress.value) {
                return;
            }
            await useInit(currentChainInfo.value.ecosystem, walletAddress.value, store);
        };

        onBeforeMount(async () => await store.dispatch('networks/initZometNets'));

        onMounted(async () => {
            !lastConnectedCall.value && connectLastConnectedWallet().then(() => (lastConnectedCall.value = true));

            await callInit();
        });

        watch(walletAddress, async () => await callInit());

        watch(walletAccount, async () => await callInit());

        watch(currentChainInfo, async () => await callInit());

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
