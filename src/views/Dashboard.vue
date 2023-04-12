<template>
  <div class="dashboard">
    <template v-if="hasConnect">
      <div class="dashboard__wallet">
        <bgSvg class="bg" />
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
import bgSvg from "@/assets/icons/dashboard/bginfo.svg";
import NotConnect from "./NotConnect";
import AddressModal from "@/components/app/modals/AddressModal";
import WalletInfoLarge from "@/components/app/WalletInfoLarge";
import Button from "@/components/ui/Button";
import ActionsMenu from "@/components/app/ActionsMenu";
import Tokens from "@/components/app/Tokens";
import { onMounted, ref } from "vue";

import useConnect from "@/compositions/useConnect";

export default {
  name: "Dashboard",
  components: {
    NotConnect,
    AddressModal,
    WalletInfoLarge,
    Button,
    ActionsMenu,
    Tokens,
    bgSvg,
  },
  setup() {
    const { hasConnect, activeConnect } = useConnect();
    const showAddressModal = ref(false);

    const dashboardActions = ref([
      { $title: "actionTokens" },
      // { $title: "actionTransactions" },
    ]);

    onMounted(() => {
      if (activeConnect.value.network) {
        activeConnect.value.updateBalances();
      }
    });

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
  @include pageStructure;

  &::-webkit-scrollbar {
    width: 0px;
    background-color: transparent;
  }

  &__wallet {
    position: relative;
    background-color: $colorSlimLightBlue;
    padding: 24px 24px 28px 24px;
    box-sizing: border-box;
    border-radius: 16px;
    min-height: 128px;

    display: flex;
    justify-content: space-between;
    margin-top: 71px;
    padding-bottom: 20px;
    overflow: hidden;

    .bg {
      position: absolute;
      right: -40px;
      top: 0;
      z-index: 0;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    z-index: 1;
  }

  &__actions {
    margin: 15px 0;
    z-index: 1;
  }

  .ml {
    margin-left: 7px;
  }
}

body.dark {
  .dashboard {
    background: rgb(12, 13, 23);

    &__wallet {
      background: $colorDarkPanel;
    }
  }
}
</style>
