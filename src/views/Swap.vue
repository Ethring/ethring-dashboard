<template>
  <div class="swap">
    <div class="swap-page">
      <Spinner v-if="loader" />
      <template v-else>
        <div class="swap-page__title">{{ $t("simpleSwap.title") }}</div>
        <div
          v-if="hasConnect && groupTokens.length && !loader"
          class="swap-page__wrap"
        >
          <component v-if="swapComponent" :is="swapComponent" />
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import SimpleSwap from "@/components/dynamic/swaps/SimpleSwap";

import { UIConfig } from "@/config/ui";
import { useStore } from "vuex";
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import Spinner from "@/components/app/Spinner";

import useConnect from "@/compositions/useConnect";
import useTokens from "@/compositions/useTokens";

export default {
  name: "Swap",
  components: {
    SimpleSwap,
    Spinner,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { groupTokens } = useTokens();

    const loader = computed(() => store.getters["tokens/loader"]);

    const { activeConnect, hasConnect } = useConnect();

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
      loader,
      groupTokens,
      hasConnect,
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
      margin-bottom: 30px;
    }

    &__wrap {
      display: flex;
      justify-content: center;
      height: calc(100vh - 200px);
    }
  }
}

body.dark {
  .swap {
    background: rgb(12, 13, 23);

    .swap-page {
      &__title {
        color: $colorWhite;
      }
    }
  }
}
</style>
