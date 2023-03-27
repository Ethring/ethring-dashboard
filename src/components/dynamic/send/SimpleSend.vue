<template>
  <div class="simple-send">
    <Select
      :network="activeConnect.network"
      :name="networks[activeConnect.network].name"
      :code="networks[activeConnect.network].code"
      :initial-balance="activeConnect.balance?.mainBalance"
      :items="tokens"
    />
    <SelectAddress class="mt-10" />
    <Button xl title="CONFIRM" class="simple-send__btn mt-10" />
  </div>
</template>
<script>
import Select from "@/components/ui/Select";
import SelectAddress from "@/components/ui/SelectAddress";
import Button from "@/components/ui/Button";

import useTokens from "@/compositions/useTokens";
import useConnect from "@/compositions/useConnect";

import { computed } from "vue";
import { useStore } from "vuex";

export default {
  name: "SimpleSend",
  components: {
    Select,
    SelectAddress,
    Button,
  },
  setup() {
    const store = useStore();

    const { tokens } = useTokens();
    const { activeConnect } = useConnect();

    const networks = computed(() => store.getters["networks/networks"]);

    console.log("activeConnect", activeConnect.value);

    return {
      activeConnect,
      networks,
      tokens,
    };
  },
};
</script>
<style lang="scss" scoped>
.simple-send {
  width: 660px;

  .mt-10 {
    margin-top: 10px;
  }

  &__btn {
    height: 64px;
    width: 100%;
  }
}
</style>
