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
            <a-typography-title :level="4">Supported ecosystems include</a-typography-title>

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

            <a-typography-paragraph content="providing users with a flexible choice to interact with diverse blockchain platforms." />

            <a-typography-paragraph content="Platform access is facilitated through" />

            <a-typography-title :level="5"> Cosmology using Keplr </a-typography-title>

            <a-typography-title :level="5"> Blocknative with support for Metamask, Coinbase, and Ledger </a-typography-title>

            <a-typography-paragraph content="providing users with flexible and secure authorization options" />

            <a-typography-title :level="5"> Dashboard </a-typography-title>

            <a-list size="small" item-layout="vertical" :data-source="AVAILABLE_PROTOCOLS">
                <template #header>
                    <a-typography-title :level="5"
                        >Data is sourced from the Pulsar service , supporting tokens and protocols, including</a-typography-title
                    >
                </template>
                <template #renderItem="{ item }">
                    <a-list-item> {{ item }} </a-list-item>
                </template>
            </a-list>

            <a-list size="small" item-layout="vertical" :data-source="AVAILABLE_MODULES">
                <template #header>
                    <a-typography-title :level="5">The available modules include</a-typography-title>
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

        const AVAILABLE_PROTOCOLS = [
            'Lending Protocols',
            'Pools',
            'Yield Farming',
            'Futures',
            'Staking',
            'Liquidity Staking (NFTs exclusively for Stargaze in the Cosmos)',
        ];

        const AVAILABLE_MODULES = ['Send', 'Swap', 'Bridge', 'SuperSwap'];

        const handleReload = () => {
            store.dispatch('app/setLastVersion', import.meta.env.VITE_APP_VERSION);
            window.location.reload(true);
        };

        return {
            releaseNotes,
            version: import.meta.env.VITE_APP_VERSION,

            EVM,
            COSMOS,
            AVAILABLE_PROTOCOLS,
            AVAILABLE_MODULES,

            handleReload,
        };
    },
};
</script>
<style lang="scss" scoped>
.update-btn {
    width: 100%;
}
</style>
