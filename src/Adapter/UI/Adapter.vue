<template>
    <a-dropdown v-model:open="activeDropdown" placement="bottom" class="wallet-adapter-container" :arrow="{ pointAtCenter: true }">
        <AccountCenter v-if="walletAddress" @toggleDropdown="() => (activeDropdown = !activeDropdown)" class="ant-dropdown-link" />
        <NotConnected v-else class="ant-dropdown-link" />

        <template #overlay>
            <div class="adapter__dropdown">
                <ConnectToEcosystems @closeDropdown="() => (activeDropdown = false)" />
                <AdapterDropdown v-if="walletAddress" @closeDropdown="() => (activeDropdown = false)" />
            </div>
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

    max-width: 300px;
    width: 100%;
    height: 48px;

    @media (max-width: 1024px) {
        width: fit-content;
    }
}

.adapter__dropdown {
    width: 356px;
    padding: 16px;
    border-radius: 16px;
    z-index: 2;
    background: var(--#{$prefix}secondary-background);
    box-shadow: 0px 4px 40px 0px $black-op-02;
}
</style>
