<template>
    <div :class="{ opened }" class="wallet-info">
        <div class="wallet-info__network">
            <!-- <img v-if="currentChainInfo.logo" :src="currentChainInfo.logo" alt="current-chain-icon" srcset="" /> -->
            <!-- <span v-else> ? </span> -->
            <WalletSvg />
        </div>
        <div class="wallet-info__wallet">
            <div class="address" @click="openMenu">
                {{ cutAddress(walletAddress) }}
            </div>
            <div class="balance">
                <div class="value">
                    <span>$</span>
                    {{ showBalance && totalBalance ? prettyNumber(totalBalance) : '****' }}
                </div>
                <eyeSvg v-if="showBalance" @click="toggleViewBalance" />
                <eyeOpenSvg v-if="!showBalance" @click="toggleViewBalance" />
            </div>
            <div v-if="marketCap.priceUsdDelta24pct" :class="{ minus: +marketCap.priceUsdDelta24pct < 0 }" class="change">
                <arrowPriceSvg />
                <div class="percent">{{ marketCap.priceUsdDelta24pct }}%</div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { cutAddress } from '@/helpers/utils';
import { prettyNumber } from '@/helpers/prettyNumber';
import eyeSvg from '@/assets/icons/dashboard/eye.svg';
import eyeOpenSvg from '@/assets/icons/dashboard/eyeOpen.svg';
import arrowPriceSvg from '@/assets/icons/dashboard/arrowprice.svg';
import WalletSvg from '@/assets/icons/dashboard/wallet.svg';

import useTokens from '@/compositions/useTokens';
import useAdapter from '@/compositions/useAdapter';

export default {
    name: 'WalletInfo',
    components: {
        eyeSvg,
        eyeOpenSvg,
        arrowPriceSvg,
        WalletSvg,
    },
    setup() {
        const store = useStore();

        const opened = ref(false);

        const openMenu = () => {
            opened.value = !opened.value;
        };

        const { walletAddress, currentChainInfo } = useAdapter();

        const { groupTokens } = useTokens();

        const marketCap = computed(() => store.getters['tokens/groupTokens']);
        const showBalance = computed(() => store.getters['app/showBalance']);

        const totalBalance = computed(() => groupTokens.value?.reduce((acc, net) => acc + net.totalSumUSD, 0) ?? 0);

        const toggleViewBalance = () => {
            store.dispatch('app/toggleViewBalance');
        };

        return {
            totalBalance,
            currentChainInfo,
            walletAddress,
            prettyNumber,
            cutAddress,
            opened,
            marketCap,
            showBalance,
            openMenu,
            toggleViewBalance,
        };
    },
};
</script>
<style lang="scss" scoped>
.wallet-info {
    display: flex;
    align-items: flex-start;
    box-sizing: border-box;

    &__network {
        width: 78px;
        height: 78px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        margin-right: 16px;
        background: #3fdfae;

        img {
            width: 60%;
        }

        svg {
            fill: $colorBlack;
            opacity: 1;
        }
    }

    &.opened {
        svg.arrow {
            margin-top: -5px;
            transform: rotate(-180deg);
        }
    }

    &__wallet {
        display: flex;
        flex-direction: column;
        justify-content: center;
        z-index: 10;

        .address {
            user-select: none;
            display: flex;
            align-items: center;
            font-family: 'Poppins_Light';
            font-size: 16px;
            margin-bottom: 15px;

            cursor: pointer;

            svg {
                @include animateEasy;
                margin-left: 4px;
                stroke: $colorBlack;
            }
        }

        .balance {
            display: flex;
            align-items: center;
            font-family: 'Poppins_SemiBold';
            font-size: 28px;
            color: $colorBlack;
            margin-top: -3px;
            user-select: none;

            .value {
                min-width: 165px;
            }

            span {
                font-family: 'Poppins_Regular';
            }

            svg {
                cursor: pointer;
                fill: #33363f;

                &:hover {
                    fill: $colorBaseGreen;
                }
            }
        }

        .change {
            display: flex;
            align-items: center;
            color: $colorGreen;

            svg {
                fill: $colorGreen;
            }

            .percent {
                user-select: none;
                margin-left: 5px;
                font-family: 'Poppins_Regular';
                font-size: 14px;
            }

            &.minus {
                color: $colorRed;

                .percent {
                    color: $colorRed;
                }

                svg {
                    fill: $colorRed !important;
                    transform: rotate(90deg);
                }
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
    .wallet-info {
        &.opened {
            // background: #0f1910;
        }

        &__network {
            background: $colorBrightGreen;

            svg {
                fill: #070c0e;
                opacity: 0.8;
            }
        }

        &__wallet {
            .address {
                color: $colorLightGreen;

                svg {
                    stroke: #636363;
                }
            }

            .balance {
                color: $colorWhite;

                span {
                    color: #73b1b1;
                }

                svg {
                    cursor: pointer;
                    fill: $colorLightGreen;

                    &:hover {
                        fill: $colorBrightGreen;
                    }
                }
            }

            .change {
                display: flex;
                align-items: center;

                &.minus {
                    color: $colorRed;

                    .percent {
                        color: $colorRed;
                    }
                }

                svg {
                    fill: $colorBrightGreen;
                }

                .percent {
                    color: $colorBrightGreen;
                }
            }
        }
    }
}
</style>
