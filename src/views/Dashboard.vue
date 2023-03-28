<template>
  <div class="dashboard">
    <Head />
    <template v-if="hasConnect">
      <div class="dashboard__wallet">
        <WalletInfoLarge />
        <div class="dashboard__controls">
          <Button
            :title="$t('dashboard.receive')"
            @click="showAddressModal = true"
          />
          <div class="ml" />
          <Button
            :title="$t('dashboard.send')"
            @click="$router.push('/send')"
          />
        </div>
      </div>
      <ActionsMenu :menu-items="dashboardActions" class="dashboard__actions" />
      <Tokens />
    </template>
    <NotConnect v-else />
    <AddressModal v-if="showAddressModal" @close="showAddressModal = false" />
  </div>
</template>

<script>
import NotConnect from "./NotConnect";
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
    NotConnect,
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
      // { $title: "actionTransactions" },
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
    background: #f5f6ff;
    padding: 15px;
    box-sizing: border-box;
    border-radius: 16px;

    display: flex;
    justify-content: space-between;
    margin-top: 40px;
    padding-bottom: 20px;
    // border-bottom: 1px solid $borderLight;
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
      background: $colorLightBgGreen;
    }
  }
}
</style>
