<template>
  <div class="send">
    <Head />
    <div class="send-page">
      <Spinner v-if="loader" />
      <template v-else>
        <div class="send-page__title">{{ $t("simpleSend.title") }}</div>
        <div
          v-if="hasConnect && groupTokens.length && !loader"
          class="send-page__wrap"
        >
          <component v-if="sendComponent" :is="sendComponent" />
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import SimpleSend from "@/components/dynamic/send/SimpleSend";
import Head from "@/components/app/Head";

import { UIConfig } from "@/config/ui";
import { useStore } from "vuex";
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Spinner from "@/components/app/Spinner";

import useConnect from "@/compositions/useConnect";
import useTokens from "@/compositions/useTokens";

export default {
  name: "Send",
  components: {
    Head,
    SimpleSend,
    Spinner,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { groupTokens } = useTokens();

    const loader = computed(() => store.getters["tokens/loader"]);

    const { activeConnect, hasConnect } = useConnect();

    const sendComponent = computed(() => {
      return UIConfig[activeConnect.value.network]?.send?.component;
    });

    onMounted(() => {
      if (activeConnect.value.network) {
        // activeConnect.value.updateBalances();
      }
    });

    watch(
      () => sendComponent.value,
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
      sendComponent,
    };
  },
};
</script>
<style lang="scss" scoped>
.send {
  @include pageStructure;

  .send-page {
    @include pageFlexColumn;

    &::-webkit-scrollbar {
      width: 0px;
      background-color: transparent;
    }

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
  .send {
    .send-page {
      &__title {
        color: $colorWhite;
      }
    }
  }
}
</style>
