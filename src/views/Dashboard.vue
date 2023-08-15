<template>
    <div class="dashboard">
        <template v-if="walletAddress">
            <div class="dashboard__wallet">
                <WalletInfoLarge />
                <div class="dashboard__controls">
                    <Button :title="$t('dashboard.receive')" @click="showAddressModal = true" />
                </div>
            </div>
            <ActionsMenu :menu-items="dashboardActions" class="dashboard__actions" />
            <Tokens />
        </template>
        <AddressModal v-if="showAddressModal" @close="showAddressModal = false" />
    </div>
</template>

<script>
import { ref } from 'vue';

import useAdapter from '@/compositions/useAdapter';

import WalletInfoLarge from '@/components/app/WalletInfoLarge';
import ActionsMenu from '@/components/app/ActionsMenu';
import AddressModal from '@/components/app/modals/AddressModal';
import Tokens from '@/components/app/Tokens';

import Button from '@/components/ui/Button';

export default {
    name: 'Dashboard',
    components: {
        AddressModal,
        WalletInfoLarge,
        Button,
        ActionsMenu,
        Tokens,
    },
    setup() {
        const { walletAddress } = useAdapter();

        const showAddressModal = ref(false);

        const dashboardActions = ref([
            { $title: 'actionTokens' },
            // { $title: "actionTransactions" },
        ]);

        return {
            walletAddress,
            showAddressModal,
            dashboardActions,
        };
    },
};
</script>
<style lang="scss" scoped>
.dashboard {
    @include pageStructure;

    &::-webkit-scrollbar {
        width: 0px;
        background-color: transparent;
    }

    &__wallet {
        position: relative;
        background-color: $colorSlimLightBlue;
        padding: 24px 24px 28px 24px;
        box-sizing: border-box;
        border-radius: 16px;
        min-height: 128px;

        display: flex;
        justify-content: space-between;
        padding-bottom: 20px;
        overflow: hidden;
        background-image: url('~@/assets/images/wallet-info/background.png');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: right;
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

body.dark {
    .dashboard {
        background: rgb(12, 13, 23);

        &__wallet {
            background: $colorDarkPanel;
        }
    }
}
</style>
