<template>
    <div key="accounts" class="connected-wallets">
        <div class="connected-wallets-label">
            <p>
                {{ $t('adapter.accountsGroup') }}
            </p>
            <DisconnectAll :disconnect-all="disconnectAll" />
        </div>
        <div v-for="account in connectedWallets" :key="account" class="connected-wallets-item">
            <ConnectedWallet :wallet="account" />
        </div>
    </div>
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
    emits: ['closeDropdown'],
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
.connected-wallets {
    margin-top: 12px;

    &-label {
        @include pageFlexRow;
        justify-content: space-between;
        p {
            color: var(--#{$prefix}adapter-label-text);
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 400;
        }
    }
}
</style>
