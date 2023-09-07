<template>
    <div class="wallet-adapter">
        <div class="wallet-adapter__account" @click.stop="$emit('toggleDropdown')">
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
            <CopyOutlined @click="handleOnCopyAddress" />
            <CaretDownOutlined />
        </div>
    </div>
</template>
<script>
import { watch } from 'vue';
import { CaretDownOutlined, CopyOutlined } from '@ant-design/icons-vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ModuleIcon from '@/Adapter/UI/Entities/ModuleIcon.vue';

import ZometLogo from '@/assets/icons/app/zometLogo.svg';
import CheckIcon from '@/assets/icons/app/checkIcon.svg';

import { cutAddress } from '@/helpers/utils';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

export default {
    name: 'AccountCenter',
    components: { ModuleIcon, ZometLogo, CheckIcon, CaretDownOutlined, CopyOutlined },
    emits: ['toggleDropdown', 'closeDropdown'],
    setup(_, { emit }) {
        const { ecosystem, walletAddress, walletAccount, connectedWallet, connectedWallets, isConnecting, action } = useAdapter();

        watch(connectedWallet, () => {
            emit('closeDropdown');
        });

        const handleOnCopyAddress = () => {
            action('SET_MODAL_ECOSYSTEM', ecosystem.value);
            return action('SET_MODAL_STATE', { name: 'addresses', isOpen: true });
        };

        return {
            isConnecting,

            ecosystem,
            connectedWallet,
            connectedWallets,
            walletAddress,
            walletAccount,

            cutAddress,
            prettyNumberTooltip,

            handleOnCopyAddress,
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

    display: flex;
    align-items: center;
    width: 100%;
    min-width: 300px;
    height: 58px;
    position: relative;

    background-color: var(--#{$prefix}banner-color);

    border: 1px solid transparent;

    transition: 0.3s;

    border-radius: 16px;
    padding: 8px 16px;

    &:hover {
        border-color: var(--#{$prefix}btn-hover);
    }

    &__account {
        display: flex;
        align-items: center;
        width: 100%;
        transition: 0.5s;
    }

    &__logos {
        display: flex;
        align-items: center;
        margin-right: 8px;

        .logo-container {
            position: relative;

            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: #1c1f2c;

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

    p {
        color: #486060;
        font-size: 12px;
    }

    &__info {
        display: flex;
        flex-direction: column;
        width: 100%;

        .account {
            font-size: var(--#{$prefix}small-lg-fs);
            font-weight: 500;
            color: var(--#{$prefix}mute-text);
        }

        .ecosystem {
            font-size: 10px;
            font-weight: 400;
            color: var(--#{$prefix}base-text);
        }
    }

    &__actions {
        display: flex;
        align-items: center;

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
