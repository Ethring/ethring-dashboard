<template>
    <div class="dashboard" data-qa="dashboard">
        <template v-if="!walletAccount">
            <ConnectWalletAdapter />
        </template>
        <template v-else>
            <div class="dashboard__wallet">
                <WalletInfoLarge />
            </div>
            <SupportedNetworks />
            <KeepAlive>
                <Assets />
            </KeepAlive>
        </template>
    </div>
</template>

<script>
import { inject } from 'vue';

import Assets from '@/components/app/Assets';

import ConnectWalletAdapter from '@/components/app/ConnectWalletAdapter.vue';
import WalletInfoLarge from '@/components/app/WalletInfoLarge';

import SupportedNetworks from '@/components/app/SupportedNetworks';

export default {
    name: 'Dashboard',
    components: {
        WalletInfoLarge,
        ConnectWalletAdapter,
        Assets,
        SupportedNetworks,
    },
    setup() {
        const useAdapter = inject('useAdapter');

        const { walletAccount } = useAdapter();

        return {
            walletAccount,
        };
    },
};
</script>
<style lang="scss" scoped>
.dashboard {
    &__wallet {
        margin-bottom: 24px;
    }

    &__controls {
        @include pageFlexRow;
        z-index: 1;
    }

    &__actions {
        margin: 15px 0;
        z-index: 1;
    }
}
</style>
