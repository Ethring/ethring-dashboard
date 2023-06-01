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

import { getChainList } from './api/networks';
import initWeb3 from './config/web3-onboard';

export default {
    name: 'App',
    components: {
        Sidebar,
        NavBar,
    },
    setup() {
        const store = useStore();

        initWeb3();

        getChainList().then((chains) => initWeb3(chains));

        const { connectWallet, connectedWallet, walletAddress } = useWeb3Onboard();

        onMounted(async () => {
            store.dispatch('networks/init');

            if (walletAddress.value) {
                useCitadel(walletAddress.value, store);
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

        watch(walletAddress, () => useCitadel(walletAddress.value, store));
    },
};
</script>
