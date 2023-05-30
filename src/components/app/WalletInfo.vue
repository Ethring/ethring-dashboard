<template>
    <div :class="{ opened }" class="wallet-info__wrap">
        <div :class="{ opened }" class="wallet-info">
            <div class="wallet-info__network">
                <component :is="`${activeConnect?.network}Svg`" />
            </div>
            <div class="wallet-info__wallet">
                <div class="address" @click="openMenu">
                    {{ cutAddress(activeConnect.accounts[0] || '') }}
                    <arrowSvg class="arrow" />
                </div>
                <div class="balance">
                    {{ showBalance ? prettyNumber(activeConnect.balance.mainBalance) : '****' }}
                    <span>{{ networks[activeConnect.network]?.code }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { cutAddress } from '@/helpers/utils';
import { prettyNumber } from '@/helpers/prettyNumber';

import useConnect from '@/compositions/useConnect';

import arrowSvg from '@/assets/icons/dashboard/arrowtopdown.svg';
import bscSvg from '@/assets/icons/networks/bsc.svg';
import ethSvg from '@/assets/icons/networks/eth.svg';
import polygonSvg from '@/assets/icons/networks/polygon.svg';
import optimismSvg from '@/assets/icons/networks/optimism.svg';
import arbitrumSvg from '@/assets/icons/networks/arbitrum.svg';
import evmosethSvg from '@/assets/icons/networks/evmoseth.svg';
import avalancheSvg from '@/assets/icons/networks/avalanche.svg';

export default {
    name: 'WalletInfo',
    components: {
        arrowSvg,
        bscSvg,
        ethSvg,
        polygonSvg,
        optimismSvg,
        arbitrumSvg,
        evmosethSvg,
        avalancheSvg,
    },
    setup() {
        const store = useStore();
        const opened = ref(false);
        const openMenu = () => {
            opened.value = !opened.value;
        };

        const { activeConnect } = useConnect();

        const networks = computed(() => store.getters['networks/networks']);
        const showBalance = computed(() => store.getters['app/showBalance']);

        return {
            cutAddress,
            opened,
            activeConnect,
            networks,
            showBalance,
            prettyNumber,
            openMenu,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-info__wrap {
    margin-top: -15px;
    padding: 15px;
    box-sizing: border-box;
    box-shadow: 0px 4px 40px transparent;
    position: absolute;
    right: -19px;
    top: 0;
    border-radius: 8px;

    &.opened {
        // box-shadow: 0px 4px 40px rgba(0, 0, 0, 0.15);
    }
}

.wallet-info {
    display: flex;
    align-items: flex-start;
    box-sizing: border-box;

    &__network {
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        margin-right: 17px;
        background: #0c0d18;
        padding-left: 1px;

        svg {
            transform: scale(0.9);
            fill: $colorWhite;
        }
    }

    &.opened {
        height: 200px;

        svg.arrow {
            margin-top: -5px;
            transform: rotate(-180deg);
        }
    }

    &__wallet {
        display: flex;
        flex-direction: column;

        .address {
            user-select: none;
            display: flex;
            align-items: center;
            font-family: 'Poppins_Light';
            font-size: 14px;
            cursor: pointer;

            svg {
                @include animateEasy;
                margin-left: 16px;
                stroke: $colorBlack;
            }
        }

        .balance {
            user-select: none;
            font-family: 'Poppins_SemiBold';
            font-size: 18px;
            color: $colorBlack;
            margin-top: -4px;

            span {
                font-family: 'Poppins_Regular';
            }
        }
    }

    .line {
        width: 100%;
        height: 1px;
        background: $borderLight;
    }
}

body.dark {
    .wallet-info__wrap {
        &.opened {
            // background: #0f1910;
            // box-shadow: 0px 4px 40px #0f1910;
        }
    }

    .wallet-info {
        &.opened {
            // background: #0f1910;
        }

        &__network {
            background: $colorDarkPanel;

            svg {
                opacity: 0.8;
            }
        }

        &__wallet {
            .address {
                color: $colorBrightGreen;

                svg {
                    stroke: #486060;
                }
            }

            .balance {
                color: $colorWhite;

                span {
                    color: $colorBrightGreen;
                }
            }
        }
    }
}
</style>
