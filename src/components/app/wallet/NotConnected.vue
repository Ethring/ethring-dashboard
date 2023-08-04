<template>
    <div class="wallets">
        <div class="row wallets__not-connected" @click="() => (showWallets = !showWallets)" v-click-away="() => (showWallets = false)">
            <div class="wallets__plus-icon">
                <plusIcon />
            </div>
            <p>{{ $t('connect.emptyTitle') }}</p>
        </div>
        <div class="wallets__select" v-if="showWallets">
            <div class="wallets__select-arrow"></div>
            <div class="wallets__block" @click.stop="connectBlocknative">
                <div class="wallets__logo">
                    <metamaskLogo />
                </div>
                <div class="wallets__logo">
                    <coinbaseLogo />
                </div>
                <div class="wallets__logo">
                    <ledgerLogo />
                </div>
                <div class="wallets__name">
                    <h4>Metamask, Coinbase, Ledger</h4>
                    <p>Ethereum, BNB, Polygon, EVM</p>
                </div>
            </div>
            <div class="wallets__block" @click.stop="connectCosmology">
                <div class="wallets__logo">
                    <keplrLogo />
                </div>
                <div class="wallets__name">
                    <h4>Keplr</h4>
                    <p>Cosmos</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
import useWalletManager from '@/compositions/useWalletManager';

import plusIcon from '@/assets/icons/dashboard/plus.svg';
import metamaskLogo from '@/assets/icons/wallets/mm.svg';
import ledgerLogo from '@/assets/icons/wallets/ledger.svg';
import coinbaseLogo from '@/assets/icons/wallets/coinbase.svg';
import keplrLogo from '@/assets/icons/wallets/keplr.svg';

export default {
    name: 'NotConnected',
    components: { plusIcon, metamaskLogo, ledgerLogo, coinbaseLogo, keplrLogo },
    setup() {
        const showWallets = ref(false);
        const { connectBlocknative, connectCosmology } = useWalletManager();
        return {
            showWallets,
            connectBlocknative,
            connectCosmology,
        };
    },
};
</script>

<style lang="scss" scoped>
* {
    margin: 0;
}
@mixin row() {
    display: flex;
    align-items: center;
}
.wallets {
    position: relative;
    .row {
        @include row;
    }
    transition: 0.5s;

    &__plus-icon {
        @include row;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #c9e0e0;
        justify-content: center;
        margin-right: 8px;
    }

    p {
        width: 160px;
        font-size: 14px;
        color: #486060;
    }

    &__not-connected:hover {
        opacity: 0.7;
        cursor: pointer;
    }
    &__select {
        box-shadow: 0px 4px 40px 0px #00000033;
        border-radius: 16px;
        padding: 16px;
        position: absolute;
        top: 60px;
        left: -80px;
        &-arrow {
            position: absolute;
            top: -24px;
            border-width: 13px;
            left: 25%;
            border-style: solid;
            border-color: transparent transparent white transparent;
        }
    }
    &__block {
        @include row;
        border: 1px solid #c9e0e0;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        &:hover {
            background: #97ffd0;
            transition: 0.5s;
        }
    }

    &__block:last-child {
        margin-bottom: 0;
    }

    &__name {
        margin-left: 10px;

        h4 {
            font-weight: 600;
            font-size: 14px;
        }

        p {
            font-size: 12px;
            color: #486060;
            width: 200px;
        }
    }

    &__logo {
        @include row;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #f0f0f0;
        justify-content: center;
        z-index: 3;

        svg {
            width: 24px;
            height: 24px;
        }
    }

    &__logo:nth-child(2) {
        background-color: #02e7f6;
        margin-left: -16px;
        z-index: 2;
    }

    &__logo:nth-child(3) {
        background-color: #d9f4f1;
        margin-left: -16px;
        z-index: 1;
    }
}
</style>
