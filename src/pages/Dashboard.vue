<template>
    <div class="dashboard" data-qa="dashboard">
        <template v-if="!walletAccount">
            <ConnectWalletAdapter />
        </template>
        <template v-else>
            <div class="dashboard__wallet">
                <WalletInfoLarge />
            </div>
            <a-row class="dashboard__options"> <HideBalances /> <SupportedNetworks /></a-row>
            <KeepAlive>
                <Assets />
            </KeepAlive>
        </template>
    </div>
</template>

<script>
import { inject } from 'vue';

import Assets from '@/components/app/Assets.vue';

import ConnectWalletAdapter from '@/components/app/ConnectWalletAdapter.vue';
import WalletInfoLarge from '@/components/app/WalletInfoLarge.vue';

import SupportedNetworks from '@/components/app/SupportedNetworks.vue';
import HideBalances from '@/components/app/HideBalances.vue';

export default {
    name: 'Dashboard',
    components: {
        WalletInfoLarge,
        ConnectWalletAdapter,
        Assets,
        SupportedNetworks,
        HideBalances,
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

    &__options {
        justify-content: flex-end;
        gap: 8px;
    }
}
</style>
