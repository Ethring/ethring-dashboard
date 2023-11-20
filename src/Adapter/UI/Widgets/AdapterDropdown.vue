<template>
    <a-menu-divider class="divider" />

    <a-menu-item-group key="accounts" :title="$t('adapter.accountsGroup')" class="connected-wallets-container">
        <a-menu-item v-for="account in connectedWallets" :key="account">
            <ConnectedWallet :wallet="account" />
        </a-menu-item>
    </a-menu-item-group>

    <a-menu-divider class="divider" />

    <a-menu-item>
        <DisconnectAll :disconnect-all="disconnectAll" />
    </a-menu-item>
</template>

<script>
import { ref } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ConnectedWallet from '@/Adapter/UI/Widgets/ConnectedWallet';

import DisconnectAll from '@/Adapter/UI/Entities/DisconnectAll';

export default {
    name: 'AdapterDropdown',
    components: {
        DisconnectAll,
        ConnectedWallet,
    },
    setup(_, { emit }) {
        const accountsModal = ref(false);

        const addressesWithChains = ref([]);
        const chainList = ref([]);

        const { disconnectAllWallets, connectedWallets = [] } = useAdapter();

        const disconnectAll = async () => {
            emit('closeDropdown');
            await disconnectAllWallets();
        };

        return {
            accountsModal,
            connectedWallets,

            addressesWithChains,
            chainList,

            disconnectAll,
        };
    },
};
</script>
<style lang="scss">
.ant-dropdown-menu-item-group-title {
    color: var(--#{$prefix}adapter-text) !important;
}
</style>
