<template>
    <div class="wallet-adapter">
        <div class="wallet-adapter__account" @click.stop="$emit('toggleDropdown')">
            <div class="wallet-adapter__logos">
                <div class="logo-container main-logo">
                    <zometLogo />
                </div>
                <div class="logo-container">
                    <metamaskLogo v-if="!walletLogo" />
                    <img v-else :src="walletLogo" alt="wallet logo" />
                    <checkIcon class="check-icon" />
                </div>
            </div>

            <div class="wallet-adapter__info">
                <p>{{ cutAddress(walletAddress, 11, 4) }}</p>
                <p>$ ***</p>
            </div>
        </div>
    </div>
</template>
<script>
import { watch } from 'vue';

import { cutAddress } from '@/helpers/utils';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import zometLogo from '@/assets/icons/app/zometLogo.svg';
import checkIcon from '@/assets/icons/app/checkIcon.svg';
import metamaskLogo from '@/assets/icons/wallets/mm.svg';

import useAdapter from '@/Adapter/compositions/useAdapter';

export default {
    name: 'AccountCenter',
    components: { zometLogo, checkIcon, metamaskLogo },
    emits: ['toggleDropdown', 'closeDropdown'],
    setup(_, { emit }) {
        const { walletAddress, walletLogo, connectedWallets } = useAdapter();

        watch(walletAddress, () => {
            emit('closeDropdown');
        });

        return {
            connectedWallets,
            walletAddress,
            walletLogo,

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
                margin-top: 22px;
                margin-left: 26px;
                transform: scale(1.1);
                position: absolute;
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
