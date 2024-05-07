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

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import ConnectedWallet from '@/core/wallet-adapter/UI/Widgets/ConnectedWallet';

import DisconnectAll from '@/core/wallet-adapter/UI/Entities/DisconnectAll';

export default {
    name: 'AdapterDropdown',
    components: {
        DisconnectAll,
        ConnectedWallet,
    },
    setup() {
        const accountsModal = ref(false);

        const addressesWithChains = ref([]);
        const chainList = ref([]);

        const { disconnectAllWallets, connectedWallets = [] } = useAdapter();

        return {
            accountsModal,
            connectedWallets,

            addressesWithChains,
            chainList,

            disconnectAll: disconnectAllWallets,
        };
    },
};
</script>
<style lang="scss">
.connected-wallets {
    margin-top: 12px;
    margin: 12px 16px 0;

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
