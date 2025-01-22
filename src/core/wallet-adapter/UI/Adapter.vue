<template>
    <a-dropdown v-model:open="open" :arrow="{ pointAtCenter: true }" placement="bottom" class="wallet-adapter-container">
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
<style lang="scss" scoped>
.wallet-adapter-container {
    position: relative;
    max-width: 300px;

    width: 100%;

    @media (max-width: 1024px) {
        width: fit-content;
    }
}

.adapter__dropdown {
    padding-top: 16px;
    padding-bottom: 16px;

    background: var(--#{$prefix}secondary-background);

    border-radius: 16px;
    max-width: 360px;
    min-width: 360px;
    width: 100%;

    box-shadow: 0px 4px 40px 0px $black-op-02;

    @media (max-width: 1024px) {
        width: fit-content;
    }
}
</style>
