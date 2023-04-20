<template>
  <div class="simple-swap">
    <Select :items="groupTokens" @select="onSelectNetwork" />
    <InfoPanel
      v-if="
        activeConnect &&
        selectedNetwork &&
        activeConnect?.network !== selectedNetwork?.net
      "
      :title="$t('mmIncorrectNetwork')"
      class="mt-10"
    />
    <div class="simple-swap__switch-wrap">
      <SelectAmount
        v-if="tokensList.length"
        :selected-network="selectedNetwork"
        :items="tokensList"
        :error="!!errorBalance"
        :on-reset="successHash"
        :new-value="selectedTokenFrom"
        :is-update="isUpdateSwapDirectionValue"
        :label="$t('simpleSwap.pay')"
        class="mt-10"
        @setAmount="onSetAmount"
        @setToken="onSetTokenFrom"
      />
      <div class="simple-swap__switch" @click="swapTokensDirection">
        <SwapSvg />
      </div>
      <SelectAmount
        v-if="tokensList.length"
        :selected-network="selectedNetwork"
        :items="tokensList"
        :error="!!errorBalance"
        :on-reset="successHash"
        :new-value="selectedTokenTo"
        :is-update="isUpdateSwapDirectionValue"
        :label="$t('simpleSwap.receive')"
        :disabled-value="receiveValue"
        :disabled="true"
        hide-max
        class="mt-10"
        @setToken="onSetTokenTo"
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
      :disabled="!!disabledSwap"
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
// import { toMantissa, fromMantissa } from "@/helpers/numbers";

import SwapSvg from "@/assets/icons/dashboard/swap.svg";

const NATIVE_CONTRACT = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

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
    const selectedTokenFrom = ref(null);
    const selectedTokenTo = ref(null);
    const isUpdateSwapDirectionValue = ref(false);

    const amount = ref("");
    const receiveValue = ref("");

    const errorBalance = ref("");

    const { groupTokens } = useTokens();
    const { activeConnect } = useConnect();
    const favouritesList = computed(() => store.getters["tokens/favourites"]);

    const disabledSwap = computed(() => {
      return (
        isLoading.value ||
        errorBalance.value ||
        !+amount.value ||
        !selectedNetwork.value ||
        !selectedTokenFrom.value ||
        !selectedTokenTo.value
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

    const onSetTokenFrom = (token) => {
      selectedTokenFrom.value = token;
      console.log("token", token);
    };

    const onSetTokenTo = async (token) => {
      selectedTokenTo.value = token;
    };

    const onSetAmount = async (value) => {
      if (isNaN(amount.value)) {
        errorBalance.value = "Incorrect amount";
        return;
      }
      amount.value = value;
      // const amountMantissa = toMantissa(value, selectedTokenFrom.value.decimals);

      await getEstimateInfo();

      errorBalance.value = "";
    };

    const swapTokensDirection = () => {
      const from = { ...selectedTokenFrom.value };
      const to = { ...selectedTokenTo.value };

      isUpdateSwapDirectionValue.value = true;
      selectedTokenFrom.value = to;
      selectedTokenTo.value = from;
      setTimeout(() => {
        isUpdateSwapDirectionValue.value = false;
      }, 300);
    };

    const getEstimateInfo = async () => {
      if (
        !selectedNetwork.value ||
        !selectedTokenFrom.value ||
        !selectedTokenTo.value ||
        !+amount.value
      ) {
        return;
      }

      const resEstimate = await store.dispatch("oneInchSwap/estimateSwap", {
        net: selectedNetwork.value.net,
        from_token_address: selectedTokenFrom.value.list
          ? NATIVE_CONTRACT
          : selectedTokenFrom.value.address,
        to_token_address: selectedTokenTo.value.list
          ? NATIVE_CONTRACT
          : selectedTokenTo.value.address,
        amount: amount.value,
      });

      if (resEstimate.error) {
        txError.value = resEstimate.error;
        return;
      }
      txError.value = "";
      receiveValue.value = resEstimate.toTokenAmount;
    };

    const swap = async () => {
      if (disabledSwap.value) {
        return;
      }

      isLoading.value = true;
      txError.value = "";

      const resSwap = await store.dispatch("oneInchSwap/getSwapTx", {
        net: selectedNetwork.value.net,
        from_token_address: selectedTokenFrom.value.list
          ? NATIVE_CONTRACT
          : selectedTokenFrom.value.address,
        to_token_address: selectedTokenTo.value.list
          ? NATIVE_CONTRACT
          : selectedTokenTo.value.address,
        amount: amount.value,
        owner: activeConnect.value.accounts[0],
        slippage: 0.5,
      });

      if (resSwap.error) {
        txError.value = resSwap.error;
        isLoading.value = false;
        return;
      }

      const resTx = await activeConnect.value.sendMetamaskTransaction(resSwap);
      if (resTx.error) {
        txError.value = resTx.error;
        isLoading.value = false;
        setTimeout(() => {
          txError.value = "";
        }, 2000);
        return;
      }

      successHash.value = getTxUrl(selectedNetwork.value.net, resTx.txHash);
      isLoading.value = false;
      setTimeout(() => {
        isLoading.value = false;
        successHash.value = "";
      }, 5000);
    };

    return {
      disabledSwap,
      activeConnect,
      networks,
      groupTokens,
      tokensList,
      favouritesList,
      errorBalance,
      selectedNetwork,

      onSelectNetwork,
      onSetTokenFrom,
      onSetTokenTo,
      onSetAmount,
      isUpdateSwapDirectionValue,
      swapTokensDirection,
      selectedTokenFrom,
      selectedTokenTo,
      receiveValue,
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
    @include animateEasy;

    svg {
      @include animateEasy;
    }

    &:hover {
      background: #97ffd0;

      svg {
        fill: $colorDarkPanel;
      }
    }

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

      &:hover {
        background: $colorBrightGreen;

        svg {
          fill: $colorBlack;
        }
      }
    }
  }
}
</style>
