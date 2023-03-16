<template>
  <div class="tokens" :class="{ empty: !tokens.length }">
    <template v-if="tokens.length">
      <div
        class="tokens__item"
        v-for="(item, ndx) in tokens"
        :key="ndx"
        @click="() => {}"
      >
        <div class="network">
          <div class="logo">
            <TokenIcon width="24" height="24" :token="item" />
          </div>
          <div class="info">
            <div class="symbol">{{ item.code }}</div>
            <div class="name">{{ item.name }}</div>
          </div>
        </div>
        <div class="amount">
          <div class="value">{{ prettyNumber(item.balance.amount) }}</div>
          <div class="symbol">{{ item.code }}</div>
        </div>
        <div class="change">
          <div class="label">-</div>
          <div class="value">
            {{ prettyNumber(item.balanceUsd) }}<span>$</span>
          </div>
        </div>
      </div>
    </template>
    <EmptyList v-else title="Tokens Not Found" />
  </div>
</template>
<script>
import useTokens from "@/compositions/useTokens";
import TokenIcon from "@/components/ui/TokenIcon";
import EmptyList from "@/components/ui/EmptyList";

import { getTokenIcon } from "@/helpers/utils";
import { prettyNumber } from "@/helpers/prettyNumber";

export default {
  name: "Tokens",
  components: {
    TokenIcon,
    EmptyList,
  },
  setup() {
    const { tokens } = useTokens();

    return {
      tokens,
      getTokenIcon,
      prettyNumber,
    };
  },
};
</script>
<style lang="scss" scoped>
.tokens {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 310px);
  height: calc(100vh - 310px);
  overflow-y: auto;

  &.empty {
    justify-content: center;
  }

  &__item {
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
}

body.dark {
  .tokens {
    &__item {
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
}
</style>
