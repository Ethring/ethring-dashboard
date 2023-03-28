<template>
  <div class="tokens" :class="{ empty: emptyLists }">
    <!-- <template v-if="tokens.length">
      <TokensItem v-for="(item, ndx) in tokens" :item="item" :key="ndx" />
    </template> -->
    <template v-if="groupTokens.length">
      <div v-for="(group, ndx) in groupTokens" :key="ndx" class="tokens__group">
        <TokensItemHeader v-if="group.list.length" :item="group" />
        <TokensItem
          v-for="(listItem, n) in group.list"
          :key="n"
          :item="listItem"
          in-group
        />
      </div>
    </template>
    <Spinner v-if="loader" />
    <EmptyList v-if="!loader && emptyLists" title="Tokens Not Found" />
  </div>
</template>
<script>
import useTokens from "@/compositions/useTokens";
import EmptyList from "@/components/ui/EmptyList";
import Spinner from "@/components/app/Spinner";

import { getTokenIcon } from "@/helpers/utils";
import { prettyNumber } from "@/helpers/prettyNumber";
import TokensItem from "./TokensItem";
import TokensItemHeader from "./TokensItemHeader";

import { useStore } from "vuex";
import { computed } from "vue";

export default {
  name: "Tokens",
  components: {
    TokensItemHeader,
    TokensItem,
    EmptyList,
    Spinner,
  },
  setup() {
    const store = useStore();
    const { tokens, groupTokens } = useTokens();

    const loader = computed(() => store.getters["tokens/loader"]);
    const emptyLists = computed(() => {
      return !tokens.value.length && !groupTokens.value.length;
    });

    return {
      tokens,
      groupTokens,
      getTokenIcon,
      prettyNumber,
      loader,
      emptyLists,
    };
  },
};
</script>
<style lang="scss" scoped>
.tokens {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 310px);
  height: calc(100vh - 310px);
  overflow-y: auto;

  &__group {
    border: 1px solid $borderLight;
    border-radius: 16px;
    padding: 0 10px;
    margin-bottom: 7px;
    box-sizing: border-box;
  }

  &.empty {
    justify-content: center;
  }
}

body.dark {
  .tokens {
    &__group {
      border-color: transparent;
      background: $colorDarkBgGreen;
    }
  }
}
</style>
