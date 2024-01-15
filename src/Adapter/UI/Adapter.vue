<template>
    <a-dropdown :arrow="{ pointAtCenter: true }" placement="bottom" class="wallet-adapter-container">
        <AccountCenter v-if="walletAddress" class="ant-dropdown-link" />
        <NotConnected v-else class="ant-dropdown-link" />

        <template #overlay>
            <a-menu class="adapter__dropdown">
                <ConnectToEcosystems />
                <AdapterDropdown v-if="walletAddress" />
            </a-menu>
        </template>
    </a-dropdown>
</template>

<script>
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
        const { walletAddress, connectedWallets } = useAdapter();

        return {
            walletAddress,
            connectedWallets,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-adapter-container {
    position: relative;
    max-width: 350px;

    width: 100%;
}

.adapter__dropdown {
    padding-top: 16px;
    padding-bottom: 16px;

    background: var(--#{$prefix}secondary-background);

    border-radius: 16px;
}
</style>
