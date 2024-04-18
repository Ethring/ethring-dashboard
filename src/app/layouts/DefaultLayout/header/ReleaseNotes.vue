<template>
    <a-drawer
        v-model:open="releaseNotes"
        class="release-notes-drawer"
        root-class-name="root-class-name"
        :title="`Release Notes ${version}`"
        placement="right"
    >
        <template #footer>
            <Button title="update" @click="handleReload" class="update-btn" />
        </template>

        <a-space direction="vertical" class="release-info">
            <a-typography-title :level="5"> Welcome to Zomet.App! 🚀 </a-typography-title>

            <a-typography-text>
                All our features are currently in
                <a-typography-text strong underline> Beta-testing </a-typography-text> phase. We're working hard to bring a new experience
                to using decentralized systems.
            </a-typography-text>

            <a-typography-text>
                Using <a-typography-text strong>EVM</a-typography-text> and <a-typography-text strong>Cosmos</a-typography-text> ecosystems,
                you can now enjoy token swapping via
                <a-typography-text strong underline>
                    <router-link to="/super-swap" class="route-link"> SuperSwap </router-link>
                </a-typography-text>
                . Simply select the tokens you want to exchange and the system will find you the best route.
            </a-typography-text>

            <a-typography-text>
                You can view all available tokens and protocols on our
                <a-typography-text strong underline>
                    <router-link to="/main" class="route-link"> dashboard </router-link>
                </a-typography-text>.
            </a-typography-text>

            <a-typography-text>
                Currently, the selection of
                <a-typography-text strong underline>networks is limited</a-typography-text>, but a wider range will be available soon, so
                stay tuned for updates!
            </a-typography-text>

            <a-typography-text>
                You can also try out the
                <a-typography-text strong underline>
                    <router-link to="/shortcuts" class="route-link"> Shortcut </router-link>
                </a-typography-text>
                - automated actions that simplify interaction with various services. Just follow a few simple steps, and the system will
                handle the rest.
            </a-typography-text>

            <a-typography-text>
                For any questions or suggestions, feel free to contact us on
                <a-typography-text underline disabled> Discord </a-typography-text>.
            </a-typography-text>

            <a-divider />

            <a-typography-text> <a-typography-text strong>Release Date:</a-typography-text> April 17 2024 </a-typography-text>
            <a-typography-text> <a-typography-text strong>Version:</a-typography-text> {{ version }} </a-typography-text>
        </a-space>
    </a-drawer>
</template>
<script>
import { useStore } from 'vuex';
import { computed } from 'vue';
import Button from '@/components/ui/Button.vue';

export default {
    name: 'ReleaseNotesDrawer',
    components: {
        Button,
    },
    setup() {
        const store = useStore();

        const releaseNotes = computed({
            get: () => store.getters['app/modal']('releaseNotes'),
            set: () => store.dispatch('app/toggleReleaseNotes'),
        });

        const EVM = ['Ethereum', 'BSC (Binance Smart Chain)', 'Avalanche', 'Fantom', 'Optimism', 'Arbitrum', 'Polygon'];

        const COSMOS = ['Cosmos-hub', 'Osmosis', 'Injective', 'Terra2', 'Stargaze', 'Juno', 'Kujira', 'Mars'];

        const AVAILABLE_WALLETS = ['Metamask', 'Coinbase', 'Ledger Live', 'Keplr'];

        const AVAILABLE_PROTOCOLS = [
            'Lending Protocols',
            'Liquidity Pools',
            'Yield Farming',
            'Futures',
            'Staking',
            'Liquidity Staking (NFTs exclusively for Stargaze in the Cosmos)',
        ];

        const AVAILABLE_MODULES = ['Send', 'Swap', 'Bridge', 'SuperSwap and IBC for Cosmos'];

        const handleReload = () => {
            store.dispatch('app/setLastVersion', process.env.APP_VERSION);
            window.location.reload(true);
        };

        return {
            releaseNotes,
            version: process.env.APP_VERSION,

            EVM,
            COSMOS,
            AVAILABLE_PROTOCOLS,
            AVAILABLE_MODULES,
            AVAILABLE_WALLETS,

            handleReload,
        };
    },
};
</script>
<style lang="scss">
.update-btn {
    width: 100%;
}

.ant-drawer .ant-drawer-content {
    background: var(--#{$prefix}secondary-background);
}

.ant-typography,
.ant-list-item,
.ant-list-header,
.ant-drawer-title,
.ant-drawer .ant-drawer-close {
    color: var(--#{$prefix}primary-text) !important;
}

.ant-list-split .ant-list-item {
    border-block-end: 1px solid var(--#{$prefix}info-border-color);
}

.release-info {
    * {
        font-family: var(--#{$prefix}font-family) !important;
    }

    .route-link {
        color: var(--#{$prefix}sub-text) !important;
    }
}

.ant-drawer-content-wrapper {
    width: 400px !important;
    max-width: 400px;
    min-width: 400px;
}
</style>
