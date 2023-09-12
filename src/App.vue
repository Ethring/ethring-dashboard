<template>
    <div class="app-wrap">
        <Sidebar />

        <div class="app-wrap__layout">
            <NavBar />
            <div>
                <router-view />
            </div>
        </div>
    </div>
</template>

<script>
import { nextTick, onMounted, watch } from 'vue';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';

import NavBar from '@/components/app/NavBar';
import Sidebar from '@/components/app/Sidebar';
import { useStore } from 'vuex';
import useInit from './compositions/useInit';

export default {
    name: 'App',
    inject: ['mixpanel'],
    components: {
        Sidebar,
        NavBar,
    },
    created() {
        this.mixpanel?.track('App:created');
    },
    setup() {
        const store = useStore();
        const { connectWallet, connectedWallet, walletAddress } = useWeb3Onboard();

        onMounted(async () => {
            await store.dispatch('networks/initZometNets');

            if (walletAddress.value && walletAddress.value !== undefined) {
                await useInit(walletAddress.value, store);
            }

            nextTick(async () => {
                const { label, provider } = connectedWallet.value || {};

                const lastConnected = localStorage.getItem('onboard.js:last_connected_wallet');
                if (!label && !provider && lastConnected) {
                    const walletLabel = JSON.parse(lastConnected);

                    if (walletLabel) {
                        return await connectWallet({
                            autoSelect: {
                                label: walletLabel[0] || 'MetaMask',
                                disableModals: true,
                            },
                        });
                    }
                }

                if (!label && !provider) {
                    return await connectWallet();
                }
            });
        });

        watch(walletAddress, async () => {
            if (walletAddress?.value) {
                await useInit(walletAddress.value, store);
            }
        });
    },
};
</script>
