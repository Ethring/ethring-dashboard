<template>
  <div :class="{ active }" class="select-amount" @click="active = !active">
    <div class="select-amount__panel">
      <div class="recipient">Amount</div>
      <div class="info-wrap">
        <div class="info">
          <div class="network">
            <TokenIcon width="24" height="24" :token="selectedToken" />
          </div>
          <div class="token">{{ selectedToken?.code }}</div>
          <arrowSvg class="arrow" />
        </div>
        <input
          v-model="amount"
          placeholder="0"
          @input="onInput"
          @blur="onBlur"
          @click.stop="() => {}"
          class="input-balance"
        />
        <div class="max" @click.stop="setMax">MAX</div>
      </div>
      <div class="balance" @click.stop="setMax">
        Balance:
        {{
          selectedToken?.balance?.amount || selectedToken?.balance?.mainBalance
        }}
        {{ selectedToken.code }}
        <div>
          ${{
            prettyNumber(
              selectedToken?.balance?.amount *
                selectedToken?.balance?.price?.USD
            )
          }}
        </div>
      </div>
    </div>
    <div v-if="active" class="select-amount__items" v-click-away="clickAway">
      <div
        v-for="(item, ndx) in items"
        :key="ndx"
        :class="{ active: item.name === selectedToken?.name }"
        class="select-amount__items-item"
        @click="setToken(item)"
      >
        <div class="info">
          <div class="name">{{ item.name }}</div>
        </div>
        <div class="amount">
          {{
            prettyNumber(
              item.balance?.amount || selectedToken?.balance?.mainBalance
            )
          }}
          <span>{{ item.code }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import arrowSvg from "@/assets/icons/dashboard/arrowdownstroke.svg";

import TokenIcon from "@/components/ui/TokenIcon";

import { prettyNumber } from "@/helpers/prettyNumber";
import { ref, watch, onMounted } from "vue";

export default {
  name: "SelectAmount",
  props: {
    selectedNetwork: {
      required: true,
    },
    items: {
      required: true,
    },
  },
  components: {
    arrowSvg,
    TokenIcon,
  },
  setup(props, { emit }) {
    const active = ref(false);
    const amount = ref("");
    const selectedToken = ref(props.items[0]);

    watch(
      () => props.items,
      (newV) => {
        if (newV.length) {
          selectedToken.value = newV[0];
        }
      }
    );

    const clickAway = () => {
      active.value = false;
    };

    const onInput = () => {
      emit("setAmount", amount.value);
      active.value = false;
    };

    const onBlur = () => {
      active.value = false;
      emit("setAmount", amount.value);
    };

    const setMax = () => {
      active.value = false;
      amount.value =
        selectedToken.value?.balance?.amount ||
        selectedToken.value?.balance?.mainBalance;
      emit("setAmount", amount.value);
    };

    const setToken = (item) => {
      amount.value = "";
      selectedToken.value = item;

      emit("setAmount", amount.value);
      emit("setToken", selectedToken.value);
    };

    onMounted(() => {
      setToken(selectedToken.value);
    });

    return {
      active,
      amount,
      selectedToken,
      prettyNumber,
      setToken,
      setMax,
      onInput,
      onBlur,
      clickAway,
    };
  },
};
</script>
<style lang="scss" scoped>
.select-amount {
  position: relative;

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #f5f6ff;
    border-radius: 8px;
    height: 160px;
    padding: 10px 25px;
    box-sizing: border-box;
    border: 2px solid transparent;
    cursor: pointer;

    .recipient {
      color: #586897;
      font-family: "Poppins_SemiBold";
    }

    .balance {
      display: flex;
      justify-content: space-between;
      color: #586897;
      font-family: "Poppins_Regular";

      div {
        font-family: "Poppins_SemiBold";
        color: #586897;
      }
    }

    .info-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info {
      display: flex;
      align-items: center;
    }

    .token {
      font-size: 28px;
      font-family: "Poppins_SemiBold";
      color: $colorBlack;
      margin-right: 10px;
    }

    .input-balance {
      width: 75%;
      text-align: right;
      min-width: 100px;
      border: none;
      outline: none;
      background: transparent;
      font-size: 28px;
      font-family: "Poppins_SemiBold";
    }

    .max {
      margin-left: 10px;
      font-size: 28px;
      color: $colorMainBlue;
      font-family: "Poppins_SemiBold";
    }

    .network {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      min-width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $colorBlack;
      margin-right: 10px;

      svg {
        fill: $colorWhite;
      }
    }

    .name {
      font-size: 28px;
      font-family: "Poppins_SemiBold";
      color: #9ca6c6;
      user-select: none;
    }

    svg.arrow {
      cursor: pointer;
      stroke: #9ca6c6;
      transform: rotate(180deg);
      @include animateEasy;
    }
  }

  &.active {
    .select-amount__panel {
      border: 2px solid $colorMainBlue;
      background: transparent;

      svg.arrow {
        transform: rotate(0deg);
      }
    }
  }

  &__items {
    z-index: 10;
    background: #fff;
    position: absolute;
    left: 0;
    top: 170px;
    width: 100%;
    min-height: 40px;
    border-radius: 8px;
    border: 1px solid $colorMainBlue;
    padding: 20px 25px;
    box-sizing: border-box;
  }

  &__items-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 50px;
    border-bottom: 1px solid #ccd5f0;
    cursor: pointer;
    @include animateEasy;

    &.active {
      .info {
        .name {
          color: $colorBlack;
          font-family: "Poppins_SemiBold";
        }
      }
    }

    &:last-child {
      border-bottom: 1px solid transparent;
    }

    &:hover {
      opacity: 0.7;
    }

    .info {
      display: flex;
      align-items: center;

      .name {
        font-size: 16px;
        color: $colorLightBlue;
        font-family: "Poppins_Regular";
      }
    }

    .amount {
      color: $colorBlack;
      font-family: "Poppins_SemiBold";

      span {
        color: $colorLightBlue;
        font-family: "Poppins_Regular";
      }
    }
  }
}

body.dark {
  .select-amount {
    &__panel {
      background: $colorDarkBgGreen;

      .recipient,
      .balance {
        color: $colorLightGreen;

        div {
          color: $colorLightBrown;
        }
      }

      svg.arrow {
        stroke: $colorLightGreen;
      }

      .input-balance {
        color: $colorLightBrown;
      }

      .info {
        .network {
          background: #22331f;
        }

        .name {
          color: $colorLightBrown;
        }
      }

      .token {
        color: $colorLightBrown;
      }

      .max {
        color: $colorLightGreen;
      }
    }

    &.active {
      .select-amount__panel {
        border: 2px solid $colorLightGreen;
        background: transparent;
      }
    }

    .select-amount__items {
      background: $colorDarkBgGreen;
      border-color: $colorLightGreen;
    }

    .select-amount__items-item {
      border-color: #e8e9c933;

      &:last-child {
        border-color: transparent;
      }

      .info {
        .name {
          color: $colorLightBrown;
        }
      }

      .amount {
        color: $colorLightGreen;

        span {
          color: $colorWhite;
        }
      }
    }

    .select-amount__items-item.active {
      .info {
        .balance {
          color: $colorWhite;
        }
      }
    }
  }
}
</style>
