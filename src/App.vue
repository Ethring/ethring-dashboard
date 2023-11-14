<template>
    <a-config-provider>
        <LoadingOverlay v-if="isConnecting" />
        <a-layout>
            <a-layout-sider class="sidebar" v-model:collapsed="collapsed" collapsible>
                <Sidebar :collapsed="collapsed" />
            </a-layout-sider>
            <a-layout class="layout">
                <a-layout-header class="header">
                    <NavBar />
                </a-layout-header>
                <a-layout-content class="content">
                    <div>
                        <router-view />
                    </div>
                </a-layout-content>
            </a-layout>
        </a-layout>
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
        const route = useRoute();
        const router = useRouter();

        const lastConnectedCall = ref(false);
        const isInitCall = ref({});
        const collapsed = ref(false);

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
            if (isInitCall.value[walletAccount.value]) {
                return;
            }

            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || showRoutesModal.value) {
                return setTimeout(callInit, 1000);
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

        onBeforeMount(async () => await store.dispatch('networks/initZometNets'));

        onMounted(async () => {
            if (!lastConnectedCall.value) {
                await connectLastConnectedWallet();
                lastConnectedCall.value = true;
            }

            await delay(100);

            if (currentChainInfo.value) {
                await callInit();
            }
        });

        const updateCollapsedState = () => {
            collapsed.value = window.innerWidth <= 1024;
        };

        window.addEventListener('resize', updateCollapsedState);

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
            Socket.addressSubscription(walletAddress.value);

            await callInit();
        });

        onUpdated(async () => {
            if (currentChainInfo.value) {
                return await callInit();
            }
        });

        return {
            isOpen,
            isConnecting,
            collapsed,
        };
    },
};
</script>

<style lang="scss" scoped>
.app-wrap.lock-scroll {
    overflow: hidden;
}

.sidebar {
    background: var(--zmt-primary);
}

.layout {
    background: var(--#{$prefix}main-background);
}

.header {
    height: 80px;

    position: sticky;
    top: 0;
    z-index: 100;

    background-color: var(--#{$prefix}nav-bar-bg-color);
}

.content {
    width: 75%;
    margin: 20px auto;
}
</style>
