<template>
    <a-dropdown v-model:open="activeDropdown" :arrow="{ pointAtCenter: true }" placement="bottom" class="wallet-adapter-container">
        <AccountCenter v-if="walletAddress" class="ant-dropdown-link" />
        <NotConnected v-else class="ant-dropdown-link" />

        <template #overlay>
            <a-menu>
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
import { ref } from 'vue';

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

        const { walletAddress, disconnectAllWallets, connectedWallets } = useAdapter();

        const disconnectAll = async () => {
            await disconnectAllWallets();
        };

        return {
            activeDropdown,
            walletAddress,
            connectedWallets,

            disconnectAll,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-adapter-container {
    position: relative;

    max-width: 400px;
    width: 100%;
}
</style>
