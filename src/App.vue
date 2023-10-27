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
import { onMounted, onUpdated, onBeforeMount, watchEffect, watch, ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import useInit from '@/compositions/useInit';
import useAdapter from '@/Adapter/compositions/useAdapter';

import Socket from '@/modules/Socket';

import WalletsModal from '@/Adapter/UI/Modal/WalletsModal';
import AddressModal from '@/Adapter/UI/Modal/AddressModal';

import NavBar from '@/components/app/NavBar';
import Sidebar from '@/components/app/Sidebar';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

import redirectOrStay from '@/shared/utils/routes';
import { delay } from '@/helpers/utils';

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
        const isInitCall = ref({});

        const route = useRoute();
        const router = useRouter();

        const {
            isConnecting,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
        } = useAdapter();

        const isOpen = computed(() => store.getters['adapters/isOpen']('wallets'));

        const showRoutesModal = computed(() => store.getters['swap/showRoutes']);

        const callInit = async () => {
            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || showRoutesModal.value) {
                return setTimeout(callInit, 1000);
            }

            store.dispatch('tokens/setLoader', true);

            await delay(1000);

            const addressesWithChains = getAddressesWithChainsByEcosystem(ecosystem);

            await useInit(store, { account: walletAccount.value, addressesWithChains, currentChainInfo: currentChainInfo.value });

            isInitCall.value = {
                ...isInitCall.value,
                [walletAddress.value]: true,
            };
        };

        onBeforeMount(async () => await store.dispatch('networks/initZometNets'));

        onMounted(async () => {
            if (!lastConnectedCall.value) {
                await connectLastConnectedWallet();
                lastConnectedCall.value = true;
            }

            await delay(100);

            await callInit();
        });

        watchEffect(async () => {
            if (isConnecting) {
                return;
            }

            const isStay = await redirectOrStay(route.path, currentChainInfo.value);

            if (!currentChainInfo.value) {
                return router.push('/main');
            }
            if (!isStay) {
                return router.push('/main');
            }

            const { net = null } = currentChainInfo.value || {};

            if (!net) {
                return router.push('/main');
            }
        });

        watch(currentChainInfo, () => {
            Socket.addressSubscription(walletAddress.value);
        });

        watch(walletAccount, async () => {
            console.log('walletAccount', walletAccount.value, isInitCall.value);
            if (isInitCall.value[walletAddress.value]) {
                return;
            }

            await callInit();
        });

        onUpdated(async () => {
            if (isInitCall.value[walletAddress.value]) {
                return;
            }

            await callInit();
        });

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
