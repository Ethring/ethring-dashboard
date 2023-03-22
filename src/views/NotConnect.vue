<template>
  <div class="notconnect">
    <div class="notconnect-page">
      <div class="notconnect-page__title">{{ $t("connect.pageTitle") }}</div>
      <div class="notconnect-page__block" @click="connectToMetamask">
        <div>
          <mmSvg />
        </div>
        <div class="description">
          <div class="title">{{ $t("connect.blockTitle") }}</div>
          <div class="wallet">{{ $t("connect.mmTitle") }}</div>
        </div>
      </div>
      <div class="notconnect-page__block keplr">
        <div>
          <keplrSvg />
        </div>
        <div class="description">
          <div class="title">{{ $t("connect.blockTitle") }}</div>
          <div class="wallet">{{ $t("connect.keplrTitle") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import mmSvg from "@/assets/icons/wallets/mm.svg";
import keplrSvg from "@/assets/icons/wallets/keplr.svg";
import { useStore } from "vuex";

export default {
  name: "NotConnect",
  components: {
    mmSvg,
    keplrSvg,
  },
  setup() {
    const store = useStore();

    const connectToMetamask = async () => {
      await store.dispatch("metamask/connectToMetamask");
    };

    return {
      connectToMetamask,
    };
  },
};
</script>
<style lang="scss" scoped>
.notconnect {
  @include pageStructure;
  width: 100%;

  .notconnect-page {
    @include pageFlexColumn;

    &__title {
      color: $colorBlack;
      font-size: 32px;
      font-family: "Poppins_SemiBold";
      margin-bottom: 30px;
    }

    &__block {
      box-sizing: border-box;
      padding: 0 12px;
      display: flex;
      align-items: center;
      width: 240px;
      height: 82px;
      border-radius: 8px;
      border: 1px solid $borderLight;
      margin-bottom: 12px;

      @include animateEasy;

      &:hover {
        opacity: 0.7;
        cursor: pointer;
      }

      .description {
        display: flex;
        flex-direction: column;
        margin-left: 12px;

        .title {
          font-size: 14px;
          font-family: "Poppins_Regular";
          color: $colorLightBlue;
        }

        .wallet {
          margin-top: -5px;
          font-size: 18px;
          font-family: "Poppins_SemiBold";
          color: $colorBlack;
        }
      }

      &.keplr {
        opacity: 0.4;
      }
    }
  }
}

body.dark {
  .notconnect {
    .notconnect-page {
      &__title {
        color: $colorWhite;
      }

      &__block {
        border-color: $borderDark;

        .description {
          .wallet {
            color: $colorLightGreen;
          }
        }
      }
    }
  }
}
</style>
