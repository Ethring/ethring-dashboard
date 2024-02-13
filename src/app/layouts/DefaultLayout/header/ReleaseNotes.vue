<template>
    <a-drawer
        v-model:open="releaseNotes"
        class="custom-class"
        root-class-name="root-class-name"
        :title="`Release Notes ${version}`"
        placement="right"
    >
        <template #footer>
            <Button title="update" @click="handleReload" class="update-btn" />
        </template>

        <a-space direction="vertical">
            <a-typography-title :level="5">New Ecosystem Support:</a-typography-title>

            <a-list size="small" item-layout="vertical" :data-source="EVM">
                <template #header>
                    <a-typography-title :level="5">EVM</a-typography-title>
                </template>
                <template #renderItem="{ item }">
                    <a-list-item> {{ item }} </a-list-item>
                </template>
            </a-list>

            <a-list size="small" item-layout="vertical" :data-source="COSMOS">
                <template #header>
                    <a-typography-title :level="5">COSMOS</a-typography-title>
                </template>
                <template #renderItem="{ item }">
                    <a-list-item> {{ item }} </a-list-item>
                </template>
            </a-list>

            <a-typography-title :level="5">User-Friendly Access:</a-typography-title>

            <a-list size="small" item-layout="vertical" :data-source="AVAILABLE_WALLETS">
                <template #renderItem="{ item }">
                    <a-list-item> {{ item }} </a-list-item>
                </template>
            </a-list>

            <a-typography-title :level="5">Dashboard Insights:</a-typography-title>

            <a-list size="small" item-layout="vertical" :data-source="AVAILABLE_PROTOCOLS">
                <template #renderItem="{ item }">
                    <a-list-item> {{ item }} </a-list-item>
                </template>
            </a-list>

            <a-list size="small" item-layout="vertical" :data-source="AVAILABLE_MODULES">
                <template #header>
                    <a-typography-title :level="5">Key Modules:</a-typography-title>
                </template>
                <template #renderItem="{ item }">
                    <a-list-item> {{ item }} </a-list-item>
                </template>
            </a-list>
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
</style>
