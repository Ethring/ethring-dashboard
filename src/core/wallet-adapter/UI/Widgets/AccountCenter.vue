<template>
    <div class="wallet-adapter" @click="$emit('toggleDropdown')">
        <div class="wallet-adapter__account">
            <div class="wallet-adapter__logos">
                <WalletIcon class="wallet-adapter__logo" />
            </div>
        </div>
    </div>
</template>
<script>
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import WalletIcon from '@/assets/icons/wallets/wallet.svg';

import { cutAddress } from '@/shared/utils/address';

export default {
    name: 'AccountCenter',
    components: {
        WalletIcon,
    },
    emits: ['toggleDropdown', 'closeDropdown'],
    setup() {
        const { ecosystem, walletAddress, walletAccount, connectedWallet, connectedWallets, isConnecting } = useAdapter();

        return {
            isConnecting,

            ecosystem,
            connectedWallet,
            connectedWallets,
            walletAddress,
            walletAccount,

            cutAddress,
        };
    },
};
</script>
<style lang="scss" scoped>
* {
    margin: 0;
}
.wallet-adapter {
    cursor: pointer;

    @include pageFlexRow;

    gap: 10px;

    width: 100%;
    position: relative;

    background-color: var(--#{$prefix}black);

    border: 1px solid var(--#{$prefix}default-border-color);

    transition: 0.3s;

    border-radius: 10px;
    padding: 12px 20px;

    &:hover {
        border-color: var(--#{$prefix}black);
        background-color: var(--#{$prefix}white);

        .account {
            color: var(--#{$prefix}black);
        }

        .arrow {
            fill: var(--#{$prefix}black);
        }
    }

    &__account {
        @include pageFlexRow;
        width: 100%;
    }

    .arrow {
        cursor: pointer;
        fill: var(--#{$prefix}white);
        @include animateEasy;
    }

    &__logos {
        @include pageFlexRow;

        .logo-container {
            position: relative;

            @include pageFlexRow;
            justify-content: center;

            width: 40px;
            height: 40px;

            border-radius: 50%;
            margin-left: -16px;

            &.main-logo {
                margin-left: 0;
                background-color: var(--#{$prefix}banner-logo-color);
            }

            .check-icon {
                transform: scale(1.1);
                position: absolute;
                right: 0;
                bottom: 0;
            }

            img {
                width: 24px;
                height: 24px;
            }
        }
    }

    &__info {
        display: flex;
        flex-direction: column;
        width: 100%;
        line-height: 16px;

        .account {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 500;
            color: var(--#{$prefix}white);

            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 160px;
        }

        .ecosystem {
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 400;
            color: var(--#{$prefix}mute-text);
        }

        @media (max-width: 1024px) {
            & {
                display: none;
            }
        }
    }

    &__actions {
        @include pageFlexRow;

        gap: 8px;
    }
}
.ant-dropdown-open {
    .arrow {
        transform: rotate(180deg) !important;
    }
}
</style>
