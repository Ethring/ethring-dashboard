<template>
  <div class="dashboard">
    <Head />
    <template v-if="hasConnect">
      <div class="dashboard__wallet">
        <WalletInfoLarge />
        <div class="dashboard__controls">
          <Button title="RECEIVE" @click="showAddressModal = true" />
          <div class="ml" />
          <Button title="SEND" />
        </div>
      </div>
      <ActionsMenu :menu-items="dashboardActions" class="dashboard__actions" />
      <Tokens />
    </template>
    <AddressModal v-if="showAddressModal" @close="showAddressModal = false" />
  </div>
</template>

<script>
import AddressModal from "@/components/app/modals/AddressModal";
import WalletInfoLarge from "@/components/app/WalletInfoLarge";
import Head from "@/components/app/Head";
import Button from "@/components/ui/Button";
import ActionsMenu from "@/components/app/ActionsMenu";
import Tokens from "@/components/app/Tokens";
import { onMounted, ref } from "vue";
import { useStore } from "vuex";

import useConnect from "@/compositions/useConnect";

export default {
  name: "Dashboard",
  components: {
    AddressModal,
    Head,
    WalletInfoLarge,
    Button,
    ActionsMenu,
    Tokens,
  },
  setup() {
    const store = useStore();
    const { hasConnect } = useConnect();
    const showAddressModal = ref(false);

    const dashboardActions = ref([
      { $title: "actionTokens" },
      { $title: "actionTransactions" },
    ]);

    const tokensItems = ref([
      { network: "eth", amount: "51", procent: "-2.45%" },
      { network: "bsc", amount: "12", procent: "-0.25%" },
      { network: "arbitrum", amount: 4, procent: "+3.15%" },
      { network: "polygon", amount: 33, procent: "+6.15%" },
      { network: "optimism", amount: 14, procent: "+16.15%" },
    ]);

    onMounted(async () => {
      await store.dispatch("networks/init");
      if (window.ethereum?.selectedAddress) {
        await store.dispatch("metamask/connectToMetamask");
      }
    });

    return {
      showAddressModal,
      hasConnect,
      dashboardActions,
      tokensItems,
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

  &__actions {
    margin: 15px 0;
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
