<template>
  <div :class="{ opened }" class="wallet-info">
    <div class="wallet-info__network">
      <bscSvg v-if="metamaskConnect.chainId === 56" />
      <ethSvg v-if="metamaskConnect.chainId === 1" />
      <polygonSvg v-if="metamaskConnect.chainId === 137" />
      <optimismSvg v-if="metamaskConnect.chainId === 10" />
      <arbitrumSvg v-if="metamaskConnect.chainId === 42161" />
      <evmosethSvg v-if="metamaskConnect.chainId === 9001" />
      <avalancheSvg v-if="metamaskConnect.chainId === 43114" />
    </div>
    <div class="wallet-info__wallet">
      <div class="address" @click="openMenu">
        {{ cutAddress(metamaskConnect.accounts[0] || "") }}
        <arrowSvg class="arrow" />
      </div>
      <div class="balance">
        <div class="value">
          {{
            showBalance
              ? prettyNumber(metamaskConnect.balance.mainBalance)
              : "****"
          }}
          <span>{{ networks[metamaskConnect.network]?.code }}</span>
        </div>
        <eyeSvg @click="toggleViewBalance" />
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
import arrowSvg from "@/assets/icons/dashboard/arrowdown.svg";
import bscSvg from "@/assets/icons/networks/bsc.svg";
import ethSvg from "@/assets/icons/networks/eth.svg";
import eyeSvg from "@/assets/icons/dashboard/eye.svg";
import arrowPriceSvg from "@/assets/icons/dashboard/arrowprice.svg";
import polygonSvg from "@/assets/icons/networks/polygon.svg";
import optimismSvg from "@/assets/icons/networks/optimism.svg";
import arbitrumSvg from "@/assets/icons/networks/arbitrum.svg";
import evmosethSvg from "@/assets/icons/networks/evmoseth.svg";
import avalancheSvg from "@/assets/icons/networks/avalanche.svg";

export default {
  name: "WalletInfo",
  components: {
    eyeSvg,
    arrowSvg,
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

    const metamaskConnect = computed(
      () => store.getters["metamask/metamaskConnector"]
    );

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
      metamaskConnect,
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
    margin-right: 10px;
    background: $colorLightGreenGray;

    svg {
      transform: scale(1.8);
      fill: $themeGreen;
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

    .address {
      user-select: none;
      display: flex;
      align-items: center;
      font-family: "Poppins_Light";
      font-size: 17px;
      cursor: pointer;

      svg {
        transition: all 0.3s ease-in-out;
        margin-left: 4px;
        stroke: $colorBlack;
      }
    }

    .balance {
      display: flex;
      align-items: center;
      font-family: "Poppins_SemiBold";
      font-size: 22px;
      color: $colorBlack;
      margin-top: -3px;
      user-select: none;

      .value {
        min-width: 165px;
      }

      span {
        font-family: "Poppins_Regular";
        margin: 0 20px 0 5px;
      }

      svg {
        cursor: pointer;
        fill: #33363f;
        stroke: #33363f;

        &:hover {
          opacity: 0.7;
        }
      }
    }

    .change {
      display: flex;
      align-items: center;

      svg {
        fill: #5b5b5b;
      }

      .percent {
        user-select: none;
        margin-left: 5px;
        font-family: "Poppins_Regular";
        font-size: 14px;
      }

      &.minus {
        svg {
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
      background: rgb(34, 51, 31);

      svg {
        opacity: 0.8;
      }
    }

    &__wallet {
      .address {
        color: $colorWhite;

        svg {
          stroke: #636363;
        }
      }

      .balance {
        color: $themeGreen;

        span {
          color: #636363;
        }

        svg {
          fill: $themeGreen;
          stroke: $themeGreen;
        }
      }

      .change {
        display: flex;
        align-items: center;

        svg {
          fill: $themeGreen;
        }

        .percent {
          color: $themeGreen;
        }
      }
    }
  }
}
</style>
