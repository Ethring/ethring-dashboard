<template>
    <div class="nav-bar">
        <Help />
        <NotConnect v-if="!connectedWallet" />
    </div>
</template>
<script>
import useWeb3Onboard from '@/compositions/useWeb3Onboard';

import Help from './Help';
import NotConnect from '@/components/app/NotConnect';

export default {
    name: 'NavBar',
    components: {
        Help,
        NotConnect,
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
@import '../../assets/styles/_root.scss';

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

    background-color: var(--#{$prefix}nav-bar-bg-color);
    margin-right: inherit;
    margin-left: inherit;
}
</style>
