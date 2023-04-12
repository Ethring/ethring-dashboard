<template>
  <div :class="{ opened }" class="wallet-info">
    <div class="wallet-info__network">
      <component :is="`${activeConnect?.network}Svg`" />
    </div>
    <div class="wallet-info__wallet">
      <div class="address" @click="openMenu">
        {{ cutAddress(activeConnect.accounts[0] || "") }}
      </div>
      <div class="balance">
        <div class="value">
          {{
            showBalance
              ? prettyNumber(activeConnect.balance.mainBalance)
              : "****"
          }}
          <span>{{ networks[activeConnect.network]?.code }}</span>
        </div>
        <eyeSvg v-if="showBalance" @click="toggleViewBalance" />
        <eyeOpenSvg v-if="!showBalance" @click="toggleViewBalance" />
      </div>
      <div
        v-if="marketCap.priceUsdDelta24pct"
        :class="{ minus: +marketCap.priceUsdDelta24pct < 0 }"
        class="change"
      >
        <arrowPriceSvg />
        <div class="percent">{{ marketCap.priceUsdDelta24pct }}%</div>
      </div>
    </div>
  </div>
</template>
<script>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { cutAddress } from "@/helpers/utils";
import { prettyNumber } from "@/helpers/prettyNumber";
import bscSvg from "@/assets/icons/networks/bsc.svg";
import ethSvg from "@/assets/icons/networks/eth.svg";
import eyeSvg from "@/assets/icons/dashboard/eye.svg";
import eyeOpenSvg from "@/assets/icons/dashboard/eyeOpen.svg";
import arrowPriceSvg from "@/assets/icons/dashboard/arrowprice.svg";
import polygonSvg from "@/assets/icons/networks/polygon.svg";
import optimismSvg from "@/assets/icons/networks/optimism.svg";
import arbitrumSvg from "@/assets/icons/networks/arbitrum.svg";
import evmosethSvg from "@/assets/icons/networks/evmoseth.svg";
import avalancheSvg from "@/assets/icons/networks/avalanche.svg";

import useConnect from "@/compositions/useConnect";

export default {
  name: "WalletInfo",
  components: {
    eyeSvg,
    eyeOpenSvg,
    arrowPriceSvg,
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

    const networks = computed(() => store.getters["networks/networks"]);
    const marketCap = computed(() => store.getters["tokens/marketCap"]);
    const showBalance = computed(() => store.getters["app/showBalance"]);

    const toggleViewBalance = () => {
      store.dispatch("app/toggleViewBalance");
    };

    return {
      prettyNumber,
      cutAddress,
      opened,
      activeConnect,
      networks,
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

    svg {
      transform: scale(1.8);
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
    z-index: 10;

    .address {
      user-select: none;
      display: flex;
      align-items: center;
      font-family: "Poppins_Light";
      font-size: 16px;
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
      font-family: "Poppins_SemiBold";
      font-size: 28px;
      color: $colorBlack;
      margin-top: -3px;
      user-select: none;

      .value {
        min-width: 165px;
      }

      span {
        font-family: "Poppins_Regular";
        margin: 0 26px 0 5px;
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
        font-family: "Poppins_Regular";
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
