<template>
  <div class="dashboard">
    <Head />
    <div v-if="hasConnect" class="dashboard__wallet">
      <WalletInfoLarge />
      <div class="dashboard__controls">
        <Button title="RECEIVE" />
        <div class="ml" />
        <Button title="SEND" />
      </div>
    </div>
  </div>
</template>

<script>
import WalletInfoLarge from "@/components/app/WalletInfoLarge";
import Head from "@/components/app/Head";
import Button from "@/components/ui/Button";
import { onMounted } from "vue";
import { useStore } from "vuex";

import useConnect from "@/compositions/useConnect";

export default {
  name: "Dashboard",
  components: {
    Head,
    WalletInfoLarge,
    Button,
  },
  setup() {
    const store = useStore();
    const { hasConnect } = useConnect();

    onMounted(async () => {
      await store.dispatch("networks/init");
      if (window.ethereum?.selectedAddress) {
        await store.dispatch("metamask/connectToMetamask");
      }
    });

    return {
      hasConnect,
    };
  },
};
</script>
<style lang="scss" scoped>
.dashboard {
  box-sizing: border-box;
  padding: 40px 150px 0;
  width: calc(100% - 250px);
  height: 100vh;

  &__wallet {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid $borderLight;
  }

  &__controls {
    display: flex;
    align-items: center;
  }

  .ml {
    margin-left: 7px;
  }
}

body.dark {
  .dashboard {
    &__wallet {
      border-bottom: 1px solid $borderDark;
    }
  }
}
</style>
