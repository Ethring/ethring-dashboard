<template>
  <div :class="{ opened }" class="wallet-info__wrap">
    <div :class="{ opened }" class="wallet-info">
      <div class="wallet-info__network">
        <bscSvg v-if="metamaskConnect.chainId === 56" />
        <ethSvg v-if="metamaskConnect.chainId === 1" />
      </div>
      <div class="wallet-info__wallet">
        <div class="address" @click="openMenu">
          {{ cutAddress(metamaskConnect.accounts[0] || "") }}
          <arrowSvg class="arrow" />
        </div>
        <div class="balance">
          {{
            showBalance
              ? prettyNumber(metamaskConnect.balance.mainBalance)
              : "****"
          }}
          <span>{{ networks[metamaskConnect.network]?.code }}</span>
        </div>
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

export default {
  name: "WalletInfo",
  components: {
    arrowSvg,
    bscSvg,
    ethSvg,
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
    const showBalance = computed(() => store.getters["app/showBalance"]);

    return {
      cutAddress,
      opened,
      metamaskConnect,
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
  right: 0;
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
    margin-right: 10px;
    background: $colorLightGreenGray;

    svg {
      fill: $themeGreen;
      opacity: 0.6;
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
      display: flex;
      align-items: center;
      font-family: "Poppins_Light";
      font-size: 13px;
      cursor: pointer;

      svg {
        transition: all 0.3s ease-in-out;
        margin-left: 4px;
        stroke: $colorBlack;
      }
    }

    .balance {
      font-family: "Poppins_SemiBold";
      font-size: 18px;
      color: $colorBlack;
      margin-top: -3px;

      span {
        font-family: "Poppins_Regular";
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
      }
    }
  }
}
</style>
