<template>
  <div class="simple-swap">
    <Select :items="groupTokens" @select="onSelectNetwork" />
    <InfoPanel
      v-if="
        activeConnect &&
        selectedNetwork &&
        activeConnect?.network !== selectedNetwork?.net
      "
      :title="$t('simpleSend.mmIncorrectNetwork')"
      class="mt-10"
    />
    <div class="simple-swap__switch-wrap">
      <SelectAmount
        v-if="tokensList.length"
        :selected-network="selectedNetwork"
        :items="tokensList"
        :error="!!errorBalance"
        :on-reset="successHash"
        :label="$t('simpleSwap.pay')"
        class="mt-10"
        @setAmount="onSetAmount"
        @setToken="onSetToken"
      />
      <div class="simple-swap__switch">
        <SwapSvg />
      </div>
      <SelectAmount
        v-if="tokensList.length"
        :selected-network="selectedNetwork"
        :items="tokensList"
        :error="!!errorBalance"
        :on-reset="successHash"
        :label="$t('simpleSwap.receive')"
        class="mt-10"
        @setAmount="onSetAmount"
        @setToken="onSetToken"
      />
    </div>
    <InfoPanel v-if="errorBalance" :title="errorBalance" class="mt-10" />
    <InfoPanel v-if="txError" :title="txError" class="mt-10" />
    <InfoPanel
      v-if="successHash"
      :hash="successHash"
      :title="$t('tx.txHash')"
      type="success"
      class="mt-10"
    />
    <Button
      xl
      :title="$t('simpleSwap.swap').toUpperCase()"
      :disabled="!!disabledSend"
      class="simple-swap__btn mt-10"
      @click="swap"
    />
  </div>
</template>
<script>
import InfoPanel from "@/components/ui/InfoPanel";
import Select from "@/components/ui/Select";
import SelectAmount from "@/components/ui/SelectAmount";

import Button from "@/components/ui/Button";

import useTokens from "@/compositions/useTokens";
import useConnect from "@/compositions/useConnect";

import { computed, ref } from "vue";
import { useStore } from "vuex";

import { getTxUrl } from "@/helpers/utils";
import SwapSvg from "@/assets/icons/dashboard/swap.svg";

export default {
  name: "SimpleSwap",
  components: {
    InfoPanel,
    Select,
    SelectAmount,
    Button,
    SwapSvg,
  },
  setup() {
    const store = useStore();
    const isLoading = ref(false);
    const txError = ref("");
    const successHash = ref("");

    const selectedNetwork = ref(null);
    const selectedToken = ref(null);
    const amount = ref("");
    const address = ref("");

    const errorAddress = ref("");
    const errorBalance = ref("");

    const { groupTokens } = useTokens();
    const { activeConnect } = useConnect();
    const favouritesList = computed(() => store.getters["tokens/favourites"]);

    const disabledSend = computed(() => {
      return (
        isLoading.value ||
        errorAddress.value ||
        errorBalance.value ||
        !+amount.value ||
        !address.value.length ||
        !selectedNetwork.value ||
        !selectedToken.value
      );
    });

    const networks = computed(() => store.getters["networks/networks"]);

    const tokensList = computed(() => {
      if (!selectedNetwork.value) {
        return [];
      }

      return [selectedNetwork.value, ...selectedNetwork.value.list];
    });

    const onSelectNetwork = (network) => {
      selectedNetwork.value = network;
    };

    const onSetToken = (token) => {
      selectedToken.value = token;
    };

    const onSetAddress = (addr) => {
      const reg = new RegExp(selectedNetwork.value.validating);
      address.value = addr;

      if (address.value.length && !reg.test(addr)) {
        errorAddress.value = "Invalid address";
        return;
      }
      errorAddress.value = "";
    };

    const onSetAmount = (value) => {
      amount.value = value;

      if (isNaN(amount.value)) {
        errorBalance.value = "Incorrect amount";
        return;
      }
      errorBalance.value = "";
    };

    const onRemoveFavourite = (params) => {
      console.log(params);
      store.dispatch("tokens/removeFavourite", params);
    };

    const swap = async () => {
      if (disabledSend.value) {
        return;
      }

      isLoading.value = true;

      txError.value = "";

      const resp = await store.dispatch("tokens/prepareTransfer", {
        net: selectedToken.value.net || selectedToken.value.network,
        from: activeConnect.value.accounts[0],
        toAddress: address.value,
        amount: amount.value,
      });
      if (resp.error) {
        isLoading.value = false;
        txError.value = resp.error;
        setTimeout(() => {
          txError.value = "";
        }, 2000);
        return;
      }

      const res = await activeConnect.value.sendMetamaskTransaction(resp);
      if (res.error) {
        txError.value = res.error;
        isLoading.value = false;
        setTimeout(() => {
          txError.value = "";
        }, 2000);
        return;
      }

      store.dispatch("tokens/setFavourites", {
        net: selectedNetwork.value.net,
        address: address.value,
      });

      successHash.value = getTxUrl(selectedNetwork.value.net, res.txHash);
      isLoading.value = false;
      setTimeout(() => {
        successHash.value = "";
      }, 5000);
    };

    return {
      disabledSend,
      activeConnect,
      networks,
      groupTokens,
      tokensList,
      favouritesList,
      errorAddress,
      errorBalance,
      selectedNetwork,
      onRemoveFavourite,

      onSelectNetwork,
      onSetAddress,
      onSetToken,
      onSetAmount,
      swap,
      txError,
      successHash,
    };
  },
};
</script>
<style lang="scss" scoped>
.simple-swap {
  width: 660px;

  &__switch-wrap {
    position: relative;
  }

  &__switch {
    cursor: pointer;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 48px;
    height: 48px;
    z-index: 10;
    border-radius: 50%;
    left: calc(50% - 24px);
    bottom: 138px;
    background: $colorGray;
    border: 4px solid $colorWhite;

    svg {
      fill: $colorPl;
    }
  }

  .mt-10 {
    margin-top: 10px;
  }

  &__btn {
    height: 64px;
    width: 100%;
  }
}

body.dark {
  .simple-swap {
    &__switch {
      background: $colorDarkPanel;
      border: 4px solid #0c0d18;

      svg {
        fill: $colorBrightGreen;
      }
    }
  }
}
</style>
