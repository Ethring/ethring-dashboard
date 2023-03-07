<template>
  <div class="tokens">
    <div
      class="tokens__item"
      v-for="(item, ndx) in tokensItems"
      :key="ndx"
      @click="setActive(ndx)"
    >
      <div class="network">
        <div class="logo"></div>
        <div class="info">
          <div class="symbol">{{ networks[item.network]?.code }}</div>
          <div class="name">{{ networks[item.network]?.name }}</div>
        </div>
      </div>
      <div class="amount">
        <div class="value">{{ item.amount }}</div>
        <div class="symbol">{{ networks[item.network]?.code }}</div>
      </div>
      <div class="change">
        <div class="label">{{ item.procent }}</div>
        <div class="value">{{ item.amount }} <span>$</span></div>
      </div>
    </div>
  </div>
</template>
<script>
import { useStore } from "vuex";
import { computed } from "vue";

export default {
  name: "Tokens",
  components: {},
  props: {
    tokensItems: {
      type: Array,
      required: true,
    },
  },
  setup() {
    const store = useStore();

    const networks = computed(() => store.getters["networks/networks"]);

    return {
      networks,
    };
  },
};
</script>
<style lang="scss" scoped>
.tokens {
  display: flex;
  flex-direction: column;

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
      }

      .symbol {
        font-size: 18px;
        font-family: "Poppins_SemiBold";
      }

      .name {
        margin-top: -3px;
        font-size: 14px;
        font-family: "Poppins_Regular";
        color: #5b5b5b;
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
