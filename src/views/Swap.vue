<template>
  <div class="swap">
    <Head />
    <div class="swap-page">
      <div class="swap-page__title">Swap</div>
      <div class="swap-page__wrap">
        <component v-if="swapComponent" :is="swapComponent" />
      </div>
    </div>
  </div>
</template>
<script>
import Head from "@/components/app/Head";
import PancakeSwap from "@/components/dynamic/swaps/PancakeSwap";
import UniSwap from "@/components/dynamic/swaps/UniSwap";
import DefaultSwap from "@/components/dynamic/swaps/DefaultSwap";

import { UIConfig } from "@/config/ui";
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

import useConnect from "@/compositions/useConnect";

export default {
  name: "Swap",
  components: {
    Head,
    PancakeSwap,
    UniSwap,
    DefaultSwap,
  },
  setup() {
    const router = useRouter();

    const { activeConnect } = useConnect();

    const swapComponent = computed(() => {
      return UIConfig[activeConnect.value.network]?.swap?.component;
    });

    watch(
      () => swapComponent.value,
      (newV) => {
        if (!newV) {
          router.push("/main");
        }
      }
    );

    return {
      swapComponent,
    };
  },
};
</script>
<style lang="scss" scoped>
.swap {
  @include pageStructure;

  .swap-page {
    @include pageFlexColumn;

    &__title {
      color: $colorBlack;
      font-size: 32px;
      font-family: "Poppins_SemiBold";
    }

    &__wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      height: calc(100vh - 200px);
    }
  }
}

body.dark {
  .swap {
    .swap-page {
      &__title {
        color: $colorWhite;
      }
    }
  }
}
</style>
