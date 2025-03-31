<template>
    <div class="not-connected" @click="connectByEcosystems(Ecosystem.EVM)">
        <div class="icon-container">
            <WalletIcon />
        </div>
        <p>{{ $t('connect.emptyTitle') }}</p>
    </div>
</template>

<script>
import WalletIcon from '@/assets/icons/wallets/wallet.svg';
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import { Ecosystem } from '@/shared/models/enums/ecosystems.enum';

export default {
    name: 'NotConnected',
    components: { WalletIcon },

    setup() {
        const { connectByEcosystems } = useAdapter();

        return {
            connectByEcosystems,
            Ecosystem,
        };
    },
};
</script>

<style lang="scss" scoped>
.not-connected {
    @include pageFlexRow;
    justify-content: center;
    gap: 3px;

    cursor: pointer;

    width: fit-content !important;
    background-color: var(--#{$prefix}black);
    border-radius: 10px;
    height: 50px;
    margin-left: auto;
    border: 1px solid transparent;

    transition: 0.2s;
    padding: 12px 20px;

    .icon-container {
        @include pageFlexRow;
        justify-content: center;

        width: 24px;
        height: 24px;
    }

    p {
        width: max-content;
        margin: 0;

        font-size: var(--#{$prefix}small-lg-fs);
        font-weight: 400;
        color: var(--#{$prefix}white);
        line-height: 1.5;
    }

    &:hover {
        border-color: var(--#{$prefix}black);
        background-color: var(--#{$prefix}white);
        p {
            color: var(--#{$prefix}black);
        }
    }
}
</style>
