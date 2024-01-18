<template>
    <div class="wallet-adapter" @click="$emit('toggleDropdown')">
        <div class="wallet-adapter__account">
            <div class="wallet-adapter__logos">
                <div class="logo-container main-logo">
                    <ZometLogo />
                </div>
                <div class="logo-container">
                    <ModuleIcon
                        width="40px"
                        height="40px"
                        :ecosystem="connectedWallet.ecosystem"
                        :module="connectedWallet.walletModule"
                        background="#1c1f2c"
                    />
                    <CheckIcon class="check-icon" />
                </div>
            </div>

            <div class="wallet-adapter__info">
                <a-skeleton-button v-if="isConnecting" :loading="isConnecting" active block />
                <template v-else>
                    <p class="account">{{ cutAddress(walletAccount, 11, 4) }}</p>
                    <p class="ecosystem">{{ ecosystem }}</p>
                </template>
            </div>
        </div>

        <div class="wallet-adapter__actions"><ArrowIcon class="arrow" /></div>
    </div>
</template>
<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import ModuleIcon from '@/Adapter/UI/Entities/ModuleIcon.vue';

import ZometLogo from '@/assets/icons/app/zometLogo.svg';
import CheckIcon from '@/assets/icons/app/checkIcon.svg';
import ArrowIcon from '@/assets/icons/dashboard/arrowdowndropdown.svg';

import { cutAddress } from '@/helpers/utils';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

export default {
    name: 'AccountCenter',
    components: {
        ModuleIcon,
        ZometLogo,
        CheckIcon,
        ArrowIcon,
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
            prettyNumberTooltip,
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

    width: 100%;
    position: relative;

    background-color: var(--#{$prefix}banner-color);

    border: 1px solid var(--#{$prefix}border-color);

    transition: 0.3s;

    border-radius: 50px;
    padding: 4px 16px 4px 4px;

    &:hover {
        border-color: var(--#{$prefix}btn-bg-color-hover);
    }

    &__account {
        @include pageFlexRow;
        width: 100%;
    }

    .arrow {
        cursor: pointer;
        fill: var(--#{$prefix}select-icon-color);
        @include animateEasy;
    }

    &__logos {
        @include pageFlexRow;
        margin-right: 8px;

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
            color: var(--#{$prefix}primary-text);
        }

        .ecosystem {
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 400;
            color: var(--#{$prefix}adapter-ecosystem-color);
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
