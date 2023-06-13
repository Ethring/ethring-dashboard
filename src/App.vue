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
import useCitadel from './compositions/useCitadel';

export default {
    name: 'App',
    components: {
        Sidebar,
        NavBar,
    },
    setup() {
        const store = useStore();

        const { connectWallet, connectedWallet, walletAddress, currentChainInfo } = useWeb3Onboard();
        const { citadelNet = 'eth' } = currentChainInfo.value;

        onMounted(async () => {
            store.dispatch('networks/init');

            if (connectedWallet.value) {
                useCitadel(walletAddress.value, store);
            }

            if (citadelNet) {
                await store.dispatch('networks/initZometTokens', citadelNet);
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

        watch(connectedWallet, () => useCitadel(walletAddress.value, store));
    },
};
</script>
