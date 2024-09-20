<template>
    <a-drawer
        v-model:open="releaseNotes"
        class="release-notes-drawer"
        root-class-name="root-class-name"
        :title="`Release Notes ${version}`"
        placement="right"
    >
        <template #footer>
            <UiButton title="update" class="update-btn" @click="handleReload" />
        </template>

        <a-space direction="vertical" class="release-info">
            <a-typography-title :level="5"> Welcome to Zomet.App! 🚀 </a-typography-title>

            <a-typography-text> We’re here to make your experience in the world of crypto easier and more convenient. </a-typography-text>

            <a-typography-text> 🚀 We're working hard to bring a new experience to using decentralized systems. </a-typography-text>

            <a-typography-text>
                We’re currently in <a-typography-text strong underline>open beta</a-typography-text>, and we’d love to hear your thoughts
                and ideas. Your feedback will help us improve! 💡
            </a-typography-text>

            <a-typography-text>
                <a-typography-text strong underline>
                    <router-link to="/main" class="route-link"> 🔗 Zomet Shortcuts </router-link>
                </a-typography-text>
                lets you effortlessly combine different services and protocols into convenient shortcuts. Try it out — it’s super simple! 😊
            </a-typography-text>

            <a-typography-text> ⚠️ Some features may be limited for now, but we’re constantly working on improvements. </a-typography-text>

            <a-typography-text>
                Stay tuned for updates on our
                <a-typography-link underline strong href="https://x.com/zometapp" target="_blank"> [Twitter] </a-typography-link> and
                <a-typography-link underline strong href="https://discord.com/invite/fneF9WCG7u" target="_blank">
                    [Discord]
                </a-typography-link>
                — exciting things are coming! 🎉
            </a-typography-text>

            <a-divider />
        </a-space>
    </a-drawer>
</template>
<script>
import { useStore } from 'vuex';
import { computed } from 'vue';
import UiButton from '@/components/ui/Button.vue';

export default {
    name: 'ReleaseNotesDrawer',
    components: {
        UiButton,
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
