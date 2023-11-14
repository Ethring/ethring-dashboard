<template>
    <a-menu-item-group key="accounts" class="connected-wallets-container">
        <div class="connected-wallets-label">
            <div>{{ $t('adapter.accountsGroup') }}</div>
            <DisconnectAll :disconnect-all="disconnectAll" />
        </div>
        <div v-for="account in connectedWallets" :key="account">
            <ConnectedWallet :wallet="account" />
        </div>
    </a-menu-item-group>
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
.connected-wallets-label {
    @include pageFlexRow;
    justify-content: space-between;

    margin-bottom: 10px;

    & > div {
        color: var(--#{$prefix}adapter-label-text);
        font-size: var(--#{$prefix}small-lg-fs);
        font-weight: 400;
    }
}

.ant-dropdown-menu-item-group-title {
    color: var(--#{$prefix}adapter-label-text) !important;
}
</style>
