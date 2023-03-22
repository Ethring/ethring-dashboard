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
import { ref } from "vue";

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
    const { hasConnect } = useConnect();
    const showAddressModal = ref(false);

    const dashboardActions = ref([
      { $title: "actionTokens" },
      { $title: "actionTransactions" },
    ]);

    return {
      showAddressModal,
      hasConnect,
      dashboardActions,
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
