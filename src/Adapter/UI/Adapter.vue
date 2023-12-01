<template>
    <a-dropdown v-model:open="activeDropdown" placement="bottom" class="wallet-adapter-container">
        <AccountCenter v-if="walletAddress" @toggleDropdown="() => (activeDropdown = !activeDropdown)" class="ant-dropdown-link" />
        <NotConnected v-else class="ant-dropdown-link" />

        <template #overlay>
            <a-menu class="adapter__dropdown">
                <ConnectToEcosystems @closeDropdown="() => (activeDropdown = false)" />
                <AdapterDropdown v-if="walletAddress" @closeDropdown="() => (activeDropdown = false)" />
            </a-menu>
        </template>
    </a-dropdown>
</template>

<script>
import { ref } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import AccountCenter from '@/Adapter/UI/Widgets/AccountCenter';
import AdapterDropdown from '@/Adapter/UI/Widgets/AdapterDropdown';
import ConnectToEcosystems from '@/Adapter/UI/Widgets/ConnectToEcosystems';

import NotConnected from '@/Adapter/UI/Entities/NotConnected';

export default {
    name: 'Adapter',
    components: {
        AccountCenter,
        AdapterDropdown,
        ConnectToEcosystems,
        NotConnected,
    },
    setup() {
        const activeDropdown = ref(false);

        const { walletAddress, connectedWallets } = useAdapter();

        return {
            activeDropdown,
            walletAddress,
            connectedWallets,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-adapter-container {
    position: relative;

    width: 300px;
    height: 48px;
}

.adapter__dropdown {
    position: absolute;
    right: 0;
    width: 356px;
    padding: 16px;
    border-radius: 16px;
    top: 5px;
    z-index: 2;
    background: var(--#{$prefix}secondary-background);

    &::before {
        content: '';
        position: absolute;
        background-color: var(--#{$prefix}secondary-background);
        width: 16px;
        z-index: 1;
        height: 16px;
        left: 50%;
        top: -5px;
        transform: rotate(45deg);
    }
}
</style>
