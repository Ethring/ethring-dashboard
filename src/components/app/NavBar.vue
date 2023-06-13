<template>
    <div class="nav-bar">
        <Help />
        <!-- <ThemeSwitcher class="head__switcher" /> -->
        <NotConnect v-if="!connectedWallet" />
    </div>
</template>
<script>
// import { useOnboard } from '@web3-onboard/vue';
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

import Help from './Help';
import NotConnect from '@/components/app/NotConnect';

export default {
    name: 'NavBar',
    components: {
        Help,
        NotConnect,
        // WalletInfo,
        // ThemeSwitcher
    },
    setup() {
        const { connectedWallet } = useWeb3Onboard();

        return {
            connectedWallet,
        };
    },
};
</script>
<style lang="scss" scoped>
.nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 35px;
    padding-left: 260px;
}
</style>
