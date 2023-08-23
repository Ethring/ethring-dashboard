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
                <p>{{ cutAddress(walletAccount, 11, 4) }}</p>
                <p>$ ***</p>
            </div>
        </div>
    </div>
</template>
<script>
import { watch } from 'vue';

import useAdapter from '@/Adapter/compositions/useAdapter';

import ModuleIcon from '@/Adapter/UI/Entities/ModuleIcon.vue';

import ZometLogo from '@/assets/icons/app/zometLogo.svg';
import CheckIcon from '@/assets/icons/app/checkIcon.svg';

import { cutAddress } from '@/helpers/utils';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

export default {
    name: 'AccountCenter',
    components: { ModuleIcon, ZometLogo, CheckIcon },
    emits: ['toggleDropdown', 'closeDropdown'],
    setup(_, { emit }) {
        const { walletAddress, walletAccount, connectedWallet, connectedWallets } = useAdapter();

        console.log('AccountCenter -> connectedWallet', connectedWallet);

        watch(walletAddress, () => {
            emit('closeDropdown');
        });

        return {
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

    display: flex;
    align-items: center;
    width: 100%;
    height: 58px;
    position: relative;
    background-color: #d9f4f1;
    border-radius: 16px;
    padding: 8px 16px;

    .row {
        display: flex;
        align-items: center;
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
                background-color: #3fdfae;
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
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
}
</style>
