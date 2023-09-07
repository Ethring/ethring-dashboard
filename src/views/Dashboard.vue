<template>
    <div class="dashboard">
        <template v-if="walletAddress">
            <div class="dashboard__wallet">
                <WalletInfoLarge />
            </div>
            <ActionsMenu :menu-items="dashboardActions" class="dashboard__actions" />
            <Tokens />
        </template>
    </div>
</template>

<script>
import { ref } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import WalletInfoLarge from '@/components/app/WalletInfoLarge';
import ActionsMenu from '@/components/app/ActionsMenu';
import Tokens from '@/components/app/Tokens';

export default {
    name: 'Dashboard',
    components: {
        WalletInfoLarge,
        ActionsMenu,
        Tokens,
    },
    setup() {
        const { walletAddress } = useAdapter();

        const dashboardActions = ref([
            { $title: 'actionTokens' },
            // { $title: "actionTransactions" },
        ]);

        return {
            walletAddress,
            dashboardActions,
        };
    },
};
</script>
<style lang="scss" scoped>
.dashboard {
    @include pageStructure;

    &__wallet {
        position: relative;
        background-color: var(--#{$prefix}banner-color);

        padding: 24px;
        box-sizing: border-box;

        border-radius: 16px;

        min-height: 128px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        padding-bottom: 20px;
        overflow: hidden;

        background-image: url('~@/assets/images/wallet-info/background.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: right;

        margin-bottom: 30px;
    }

    &__controls {
        display: flex;
        align-items: center;
        z-index: 1;
    }

    &__actions {
        margin: 15px 0;
        z-index: 1;
    }
}
</style>
