<template>
    <a-dropdown v-model:open="open" :arrow="{ pointAtCenter: true }" placement="bottomRight" class="wallet-adapter-container">
        <AccountCenter v-if="walletAddress" class="ant-dropdown-link" />
        <NotConnected v-else class="ant-dropdown-link" />

        <template #overlay>
            <a-menu v-if="walletAddress" class="adapter__dropdown">
                <AdapterDropdown v-if="walletAddress" />
            </a-menu>
        </template>
    </a-dropdown>
</template>

<script>
import { ref } from 'vue';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import AccountCenter from '@/core/wallet-adapter/UI/Widgets/AccountCenter';
import AdapterDropdown from '@/core/wallet-adapter/UI/Widgets/AdapterDropdown';

import NotConnected from '@/core/wallet-adapter/UI/Entities/NotConnected';

export default {
    name: 'Adapter',
    components: {
        AccountCenter,
        AdapterDropdown,
        NotConnected,
    },
    setup() {
        const { walletAddress, connectedWallets } = useAdapter();

        const open = ref(false);

        return {
            open,
            walletAddress,
            connectedWallets,
        };
    },
};
</script>
