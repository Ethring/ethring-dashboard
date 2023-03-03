<template>
  <div class="head">
    <Help />
    <ThemeSwitcher class="head__switcher" />
    <NotConnect v-if="!hasConnect" />
    <WalletInfo v-if="hasConnect" />
  </div>
</template>
<script>
import Help from "./Help";
import NotConnect from "@/components/app/NotConnect";
import WalletInfo from "@/components/app/WalletInfo";
import ThemeSwitcher from "@/components/app/ThemeSwitcher.vue";

import useConnect from "@/compositions/useConnect";

export default {
  name: "Head",
  components: {
    Help,
    NotConnect,
    WalletInfo,
    ThemeSwitcher,
  },
  setup() {
    const { hasConnect } = useConnect();

    return {
      hasConnect,
    };
  },
};
</script>
<style lang="scss" scoped>
.head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__switcher {
    position: absolute;
    right: 240px;
  }
}
</style>
