<template>
    <NotConnected v-if="!connectedWallet" />
    <div v-else class="wallet-adapter">
        <div
            class="wallet-adapter__account"
            @click="() => (showDropdown = true)"
            v-click-away="
                () => {
                    close();
                }
            "
        >
            <div class="wallet-adapter__zomet-logo">
                <zometLogo />
            </div>
            <div class="wallet-adapter__logo">
                <metamaskLogo />
                <checkIcon class="wallet-adapter__check-icon" />
            </div>
            <div>
                <p>{{ cutAddress(walletAddress, 6, 4) }}</p>
                <h3><span>$</span> {{ prettyNumberTooltip(walletBalance.balanceUsd, 4) }}</h3>
            </div>
            <div class="wallet-adapter__current" @click.stop="() => (showSelectNetwork = !showSelectNetwork)">
                <div>
                    <img v-if="currentChainInfo" :src="currentChainInfo?.logo" alt="network-logo" />
                </div>
                <h4>{{ currentChainInfo.name }}</h4>
                <arrowSvg class="arrow" />
            </div>
            <div class="wallet-adapter__select" v-if="showSelectNetwork">
                <div class="wallet-adapter__select-arrow"></div>
                <div
                    v-for="(elem, i) of zometNetworks"
                    :key="i"
                    @click.stop="
                        () => {
                            changeNetwork(elem.chain_id);
                            close();
                        }
                    "
                >
                    <div class="wallet-adapter__select-logo">
                        <img :src="elem.logo" />
                    </div>
                    <h4>{{ elem.name }}</h4>
                </div>
            </div>
        </div>
        <div class="wallet-adapter__dropdown" v-if="showDropdown">
            <div class="row">
                <div class="wallet-adapter__logo">
                    <!-- <img v-if="connectedWallet" :src="connectedWallet.icon" alt="network-logo" /> -->
                    <metamaskLogo />
                    <checkIcon class="wallet-adapter__check-icon" />
                </div>
                <div>
                    <p>{{ cutAddress(walletAddress, 6, 4) }}</p>
                    <h3>
                        {{ prettyNumberTooltip(walletBalance.balance) }} <span>{{ walletBalance.code }}</span>
                    </h3>
                </div>
            </div>
            <div
                class="row"
                @click.stop="
                    () => {
                        connectAnotherWallet();
                        close();
                    }
                "
            >
                <div class="wallet-adapter__dropdown-icon">
                    <plusIcon />
                </div>
                <span>{{ $t('connect.anotherWallet') }}</span>
            </div>
            <div
                class="row"
                @click.stop="
                    () => {
                        disconnectAllWallets();
                        close();
                    }
                "
            >
                <div class="wallet-adapter__dropdown-icon">
                    <disconnectIcon />
                </div>
                <span>{{ $t('connect.disconnectWallets') }}</span>
            </div>
            <hr />
            <div class="row">
                <div class="wallet-adapter__logo">
                    <img v-if="currentChainInfo" :src="currentChainInfo?.logo" alt="network-logo" />
                    <checkIcon class="wallet-adapter__check-icon" />
                </div>
                <div>
                    <p>{{ $t('connect.currentNetwork') }}</p>
                    <h5>
                        {{ currentChainInfo.name }}
                    </h5>
                </div>
            </div>
            <hr />
            <div class="row">
                <div class="wallet-adapter__logo">
                    <blockNativeLogo />
                </div>
                <div>
                    <p>Web3-Onboard</p>
                    <h5>{{ connectedService }}</h5>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import useWalletManager from '@/compositions/useWalletManager';

import { cutAddress } from '@/helpers/utils';
import { prettyNumberTooltip } from '@/helpers/prettyNumber';

import arrowSvg from '@/assets/icons/dashboard/arrowtopdown.svg';
import zometLogo from '@/assets/icons/app/zometLogo.svg';
import checkIcon from '@/assets/icons/app/checkIcon.svg';
import plusIcon from '@/assets/icons/dashboard/plus.svg';
import disconnectIcon from '@/assets/icons/dashboard/disconnect.svg';
import metamaskLogo from '@/assets/icons/wallets/mm.svg';
import blockNativeLogo from '@/assets/icons/wallets/blocknative.svg';

import NotConnected from './NotConnected.vue';

export default {
    name: 'WalletAdapter',
    components: { arrowSvg, zometLogo, checkIcon, plusIcon, disconnectIcon, metamaskLogo, blockNativeLogo, NotConnected },
    setup() {
        const showDropdown = ref(false);
        const showSelectNetwork = ref(false);
        const store = useStore();
        const zometNetworks = computed(() => store.getters['networks/zometNetworksList']);

        const {
            currentChainInfo,
            walletBalance,
            connectedWallet,
            walletAddress,
            disconnectAllWallets,
            connectAnotherWallet,
            connectedService,
            changeNetwork,
        } = useWalletManager();

        const close = () => {
            showDropdown.value = false;
            showSelectNetwork.value = false;
        };

        return {
            connectedWallet,
            walletAddress,
            currentChainInfo,
            showDropdown,
            walletBalance,
            connectedService,
            showSelectNetwork,
            zometNetworks,

            cutAddress,
            prettyNumberTooltip,
            disconnectAllWallets,
            connectAnotherWallet,
            changeNetwork,
            close,
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
.wallet-adapter {
    @include row;
    height: 58px;
    position: relative;
    background-color: #d9f4f1;
    border-radius: 50px;
    padding: 8px;
    cursor: pointer;

    .row {
        @include row;
    }

    &__account {
        @include row;
        transition: 0.5s;
    }

    &__select {
        transition: 0.5s;
        position: absolute;
        top: 100%;
        right: 0;
        background-color: $colorWhite;
        border-radius: 16px;
        padding: 10px;
        box-shadow: 0px 4px 10px 0px #00000033;

        &-arrow {
            position: absolute;
            top: -20px;
            border-width: 10px;
            left: 70%;
            border-style: solid;
            border-color: transparent transparent white transparent;
        }

        div {
            @include row;
            transition: 0.5s;

            &:hover {
                opacity: 0.7;
            }
        }

        h4 {
            font-size: 14px;
            color: #1c1f2c;
            font-weight: 500;
            line-height: 34px;
        }

        &-logo {
            @include row;
            justify-content: center;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: #3fdfae;
            margin-right: 8px;

            img {
                width: 20px;
                height: 20px;
            }
        }
    }

    &__zomet-logo,
    &__logo {
        @include row;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #3fdfae;
        justify-content: center;
    }

    &__logo {
        background-color: #1c1f2c;
        margin-left: -16px;
        margin-right: 8px;
        position: relative;
        img {
            width: 24px;
            height: 24px;
        }
    }

    &__check-icon {
        margin-top: 22px;
        margin-left: 26px;
        transform: scale(1.1);
        position: absolute;
    }

    p {
        color: #486060;
        font-size: 12px;
        line-height: 16px;
    }

    h3 {
        span {
            color: #486060;
            font-weight: 400;
        }
        font-size: 14px;
        color: #1c1f2c;
        font-weight: 800;
        line-height: 18px;
    }

    h5 {
        font-size: 14px;
        color: #1c1f2c;
        font-weight: 600;
        line-height: 18px;
    }

    &__current {
        @include row;
        padding: 4px;
        height: 32px;
        border-radius: 32px;
        margin-left: 8px;
        background-color: $colorWhite;

        h4 {
            color: #486060;
            font-weight: 600;
            font-size: 12px;
            line-height: 16px;
            width: 75px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        div {
            @include row;
            justify-content: center;
            background-color: #97ffd0;
            border-radius: 50%;
            height: 24px;
            width: 24px;
            margin-right: 6px;
        }

        img {
            width: 16px;
            height: 16px;
        }
        .arrow {
            transform: scale(0.8);
            margin-left: 4px;
        }
    }
    &__dropdown {
        transition: 0.5s;
        position: absolute;
        top: 0;
        left: 0;
        background-color: $colorWhite;
        border-radius: 16px;
        padding: 10px;
        width: 316px;
        box-shadow: 0px 4px 40px 0px #00000033;

        &-icon {
            @include row;
            justify-content: center;
            background-color: #d9f4f1;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin: 0 6px 0 10px;
        }
        .wallet-adapter__logo {
            margin-left: 0;
        }
        .row {
            margin: 0 0 10px;
            span {
                color: #0d7e71;
                font-size: 14px;
                font-weight: 500;
            }
        }
    }
    hr {
        border-top: none;
        border-bottom: 1.5px dashed #73b1b1;
        margin-bottom: 8px;
    }
}

body.dark {
}
</style>
