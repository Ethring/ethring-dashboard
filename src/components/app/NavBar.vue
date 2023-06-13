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
    position: fixed;

    top: 0;
    left: 0;
    right: 0;

    z-index: 997;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 40px 0 30px 260px;

    background-color: $colorWhite;

    margin-left: inherit;
}
</style>
