<template>
    <div class="dashboard">
        <template v-if="connectedWallet">
            <div class="dashboard__wallet">
                <WalletInfoLarge />
                <div class="dashboard__controls">
                    <Button :title="$t('dashboard.receive')" @click="showAddressModal = true" />
                </div>
            </div>
            <Assets />
        </template>
        <AddressModal v-if="showAddressModal" @close="showAddressModal = false" />
    </div>
</template>

<script>
import { ref } from 'vue';

import AddressModal from '@/components/app/modals/AddressModal';

import WalletInfoLarge from '@/components/app/WalletInfoLarge';
import Button from '@/components/ui/Button';
import Assets from '@/components/app/Assets';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';

export default {
    name: 'Dashboard',
    components: {
        AddressModal,
        WalletInfoLarge,
        Button,
        Assets,
    },
    setup() {
        const { connectedWallet } = useWeb3Onboard();
        const showAddressModal = ref(false);

        return {
            showAddressModal,
            connectedWallet,
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
        background-color: var(--#{$prefix}banner-color);
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
</style>
