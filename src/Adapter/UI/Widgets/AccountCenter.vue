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

        <div class="wallet-adapter__actions">
            <ArrowUpIcon />
        </div>
    </div>
</template>
<script>
import useAdapter from '@/Adapter/compositions/useAdapter';

import ModuleIcon from '@/Adapter/UI/Entities/ModuleIcon.vue';

import ZometLogo from '@/assets/icons/app/zometLogo.svg';
import CheckIcon from '@/assets/icons/app/checkIcon.svg';
import ArrowUpIcon from '@/assets/icons/dashboard/arrowtopdown.svg';

import { cutAddress } from '@/helpers/utils';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

export default {
    name: 'AccountCenter',
    components: {
        ModuleIcon,
        ZometLogo,
        CheckIcon,
        ArrowUpIcon,
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
    min-width: 300px;
    height: 58px;
    position: relative;

    background-color: var(--#{$prefix}banner-color);

    border: 1px solid transparent;

    transition: 0.3s;

    border-radius: 50px;
    padding: 8px 16px;

    &:hover {
        border-color: var(--#{$prefix}btn-bg-color-hover);
    }

    &__account {
        @include pageFlexRow;
        width: 100%;
        transition: 0.5s;
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
            font-weight: 600;
            color: var(--#{$prefix}primary-text);
        }

        .ecosystem {
            font-size: var(--#{$prefix}small-sm-fs);
            font-weight: 400;
            color: var(--#{$prefix}base-text);
        }
    }

    &__actions {
        @include pageFlexRow;

        gap: 8px;

        color: var(--#{$prefix}icon-active);

        span {
            cursor: pointer;
        }

        span:hover {
            color: var(--#{$prefix}icon-hover);
        }
    }
}
</style>
