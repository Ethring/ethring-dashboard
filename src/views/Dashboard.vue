<template>
    <div class="dashboard" data-qa="dashboard">
        <template v-if="walletAddress">
            <div class="dashboard__wallet">
                <WalletInfoLarge />
            </div>
            <Assets />
        </template>
    </div>
</template>

<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import Assets from '@/components/app/Assets';
import WalletInfoLarge from '@/components/app/WalletInfoLarge';

export default {
    name: 'Dashboard',
    components: {
        WalletInfoLarge,
        Assets,
    },
    setup() {
        const { walletAddress } = useAdapter();

        return {
            walletAddress,
        };
    },
};
</script>
<style lang="scss" scoped>
.dashboard {
    &__wallet {
        position: relative;
        background-color: var(--#{$prefix}banner-color);

        padding: 18px 24px;
        box-sizing: border-box;

        border-radius: 16px;
        height: 80px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        overflow: hidden;

        background-image: url('~@/assets/images/wallet-info/background.png');
        background-size: 60%;
        background-repeat: no-repeat;
        background-position: top right;

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
