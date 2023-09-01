<template>
    <div class="nav-bar">
        <Help />
        <button @click="toggleTheme" aria-label="Toggle themes" id="theme-toggle">
            <span>Toggle Theme</span>
        </button>
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

        var storedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (storedTheme) {
            document.documentElement.setAttribute('data-theme', storedTheme);
        }

        const toggleTheme = () => {
            console.log('11');
            let currentTheme = document.documentElement.getAttribute('data-theme');
            let targetTheme = 'light';

            if (currentTheme === 'light') {
                targetTheme = 'dark';
            }

            document.documentElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);
        };

        return {
            connectedWallet,
            toggleTheme,
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
