<template>
  <div :class="{ inGroup }" class="tokens__item">
    <div class="network">
      <div class="logo">
        <TokenIcon width="24" height="24" :token="item" :dark="inGroup" />
      </div>
      <div class="info">
        <div v-if="!inGroup" class="symbol">{{ item.code }}</div>
        <div class="name">{{ item.name }}</div>
        <div v-if="inGroup" class="blockchain">{{ item.standard }}</div>
      </div>
    </div>
    <div class="amount">
      <div class="value">
        {{ showBalance ? prettyNumber(item.balance.amount) : "****" }}
      </div>
      <div class="symbol">{{ item?.code }}</div>
    </div>
    <div class="change">
      <div class="label">-</div>
      <div class="value">
        {{ showBalance ? prettyNumber(item.balanceUsd) : "****" }}<span>$</span>
      </div>
    </div>
  </div>
</template>
<script>
import { prettyNumber } from "@/helpers/prettyNumber";
import TokenIcon from "@/components/ui/TokenIcon";
import { computed } from "vue";
import { useStore } from "vuex";

export default {
  name: "TokensItem",
  props: {
    item: {
      required: true,
    },
    inGroup: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    TokenIcon,
  },
  setup() {
    const store = useStore();
    const showBalance = computed(() => store.getters["app/showBalance"]);

    return {
      prettyNumber,
      showBalance,
    };
  },
};
</script>
<style lang="scss" scoped>
.tokens__item {
  min-height: 72px;
  border: 1px solid $borderLight;
  border-radius: 16px;
  margin-bottom: 7px;
  display: flex;
  align-items: center;
  font-family: "Poppins_Light";
  font-size: 22px;
  color: $colorBlack;
  cursor: pointer;
  padding: 0 10px;
  box-sizing: border-box;

  &.inGroup {
    border-color: transparent;
    margin-bottom: 3px;
    padding: 3px 0 0 0;
    min-height: 55px;

    .network {
      .logo {
        background: #ccd5f0;
      }
    }
  }

  .network {
    width: 60%;
    display: flex;
    align-items: center;

    .logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $colorBlack;
      margin-right: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .symbol {
      font-size: 18px;
      font-family: "Poppins_SemiBold";
    }

    .name {
      margin-top: -3px;
      font-size: 14px;
      font-family: "Poppins_Regular";
      color: $colorMainBlue;
    }

    .blockchain {
      // margin-top: -3px;
      color: $colorRed;
      font-size: 14px;
      text-transform: uppercase;
    }
  }

  .amount {
    width: 20%;
    display: flex;
    align-items: center;

    .value {
      font-size: 18px;
      font-family: "Poppins_SemiBold";
      margin-right: 5px;
      color: $colorMainBlue;
    }

    .symbol {
      font-size: 14px;
      font-family: "Poppins_Regular";
      color: #5b5b5b;
    }
  }

  .change {
    width: 20%;
    display: flex;
    flex-direction: column;

    .label {
      font-size: 14px;
      font-family: "Poppins_Regular";
      color: #5b5b5b;
      text-align: right;
    }

    .value {
      font-size: 16px;
      font-family: "Poppins_SemiBold";
      text-align: right;
    }
  }
}

body.dark {
  .tokens__item {
    background: $colorDarkBgGreen;
    border-color: transparent;

    &.inGroup {
      border-color: transparent;

      .network {
        .logo {
          background: #22331f;
        }
      }
    }

    .network {
      .logo {
        background: #22331f;
      }

      .info {
        .symbol {
          color: $colorWhite;
        }

        .name {
          color: $themeGreen;
        }
      }
    }

    .amount {
      .value {
        color: $themeGreen;
      }

      .symbol {
        color: $colorWhite;
      }
    }

    .change {
      .label {
        color: $colorWhite;
      }

      .value {
        color: $themeGreen;
      }
    }
  }
}
</style>
