<template>
    <a-config-provider>
        <LoadingOverlay v-if="isSpinning" :spinning="isSpinning" :tip="loadingTitle" />
        <a-layout>
            <a-layout-sider class="sidebar" v-model:collapsed="collapsed" collapsible>
                <Sidebar :collapsed="collapsed" />
            </a-layout-sider>
            <a-layout class="layout">
                <a-layout-header class="header">
                    <NavBar />
                </a-layout-header>
                <a-layout-content class="content" data-qa="content">
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
import { onMounted, onUpdated, watchEffect, watch, ref, computed, onBeforeMount } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import useInit from '@/compositions/useInit/';
import useAdapter from '@/Adapter/compositions/useAdapter';
import { ECOSYSTEMS } from '@/Adapter/config';

import Socket from './modules/Socket';

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

        const isConfigLoading = computed({
            get: () => store.getters['networks/isConfigLoading'],
            set: (value) => store.dispatch('networks/setConfigLoading', value),
        });

        const {
            isConnecting,
            walletAddress,
            walletAccount,
            currentChainInfo,
            connectLastConnectedWallet,
            getAddressesWithChainsByEcosystem,
            getChainListByEcosystem,
            getIBCAssets,
            // getNativeTokenByChain,
        } = useAdapter();

        const isSpinning = computed(() => isConfigLoading.value || isConnecting.value);

        const isOpen = computed(() => store.getters['adapters/isOpen']('wallets'));

        const showRoutesModal = computed(() => store.getters['bridgeDex/showRoutes']);

        const loadingTitle = computed(() => {
            if (isConfigLoading.value) {
                return 'dashboard.loadingConfig';
            }

            if (isConnecting.value) {
                return 'dashboard.connecting';
            }

            return '';
        });

        const callSubscription = async () => {
            const { ecosystem } = currentChainInfo.value || {};

            if (!ecosystem) {
                return;
            }

            await delay(1000);

            const addressesWithChains = getAddressesWithChainsByEcosystem(ecosystem);

            socketSubscriptions(addressesWithChains);
        };

        const socketSubscriptions = (addresses) => {
            for (const chain in addresses) {
                const { address } = addresses[chain] || {};

                if (!address) {
                    continue;
                }

                if (address === walletAddress.value) {
                    continue;
                }

                Socket.addressSubscription(address);
            }

            Socket.addressSubscription(walletAddress.value);
        };

        const callInit = async () => {
            if (isInitCall.value[walletAccount.value]) {
                return;
            }

            const { ecosystem, walletModule } = currentChainInfo.value || {};

            if (!walletModule || !ecosystem || !walletAddress.value || showRoutesModal.value) {
                return setTimeout(callInit, 1000);
            }

            isConfigLoading.value = true;
            store.dispatch('tokens/setLoader', true);

            await store.dispatch('networks/initZometNets', ecosystem.toLowerCase());

            isInitCall.value = {
                ...isInitCall.value,
                [walletAccount.value]: true,
            };

            await delay(1000);

            const addressesWithChains = getAddressesWithChainsByEcosystem(ecosystem);

            await useInit(store, { account: walletAccount.value, addressesWithChains, currentChainInfo: currentChainInfo.value });
        };

        onBeforeMount(async () => {
            await store.dispatch('bridgeDex/getServices');
        });

        onMounted(async () => {
            const chains = getChainListByEcosystem(ECOSYSTEMS.COSMOS);

            for (const { chain_name } of chains) {
                store.dispatch('networks/setTokensByCosmosNet', {
                    network: chain_name,
                    tokens: getIBCAssets(ECOSYSTEMS.COSMOS, chain_name),
                });
            }

            Socket.init(store);

            store.dispatch('tokens/setLoader', true);

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

        watch(currentChainInfo, async () => await callSubscription());

        watch(walletAccount, async () => {
            store.dispatch('tokenOps/setSrcToken', null);
            store.dispatch('tokenOps/setDstToken', null);

            await callInit();
            await callSubscription();
        });

        onUpdated(async () => {
            if (currentChainInfo.value) {
                await callSubscription();
                return await callInit();
            }
        });

        return {
            isOpen,
            isSpinning,

            collapsed,
            loadingTitle,
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
