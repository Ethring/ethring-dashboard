<template>
  <div class="tokens" :class="{ empty: emptyLists }">
    <!-- <template v-if="tokens.length">
      <TokensItem v-for="(item, ndx) in tokens" :item="item" :key="ndx" />
    </template> -->
    <template v-if="groupTokens.length > 1">
      <div
        v-for="(group, ndx) in groupTokens.filter((g) => g.list.length)"
        :key="ndx"
        :class="{ hide: groupHides[ndx] }"
        class="tokens__group"
        @click="toggleGroup(ndx)"
      >
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
    <EmptyList v-if="!loader && emptyLists" title="You don't have any assets" />
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
import { computed, ref } from "vue";

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
    const groupHides = ref({});

    const loader = computed(() => store.getters["tokens/loader"]);
    const emptyLists = computed(() => {
      return (
        !tokens.value.length && groupTokens.value.every((g) => !g.list.length)
      ); // <=1 - parent network
    });

    const toggleGroup = (groupNdx) => {
      groupHides.value[groupNdx] = !groupHides.value[groupNdx];
    };

    return {
      groupHides,
      tokens,
      groupTokens,
      getTokenIcon,
      prettyNumber,
      loader,
      emptyLists,
      toggleGroup,
    };
  },
};
</script>
<style lang="scss" scoped>
.tokens {
  display: flex;
  flex-direction: column;
  // min-height: calc(100vh - 310px);
  // height: calc(100vh - 310px);
  overflow-y: auto;

  &__group {
    border: 1px solid $colorLightGreen;
    border-radius: 16px;
    padding: 0 10px;
    margin-bottom: 7px;
    box-sizing: border-box;
    @include animateEasy;

    &.hide {
      height: 74px;
      min-height: 74px;
      overflow: hidden;
    }
  }

  &.empty {
    justify-content: center;
  }
}

body.dark {
  .tokens {
    &__group {
      border-color: transparent;
      background: $colorDarkPanel;
    }
  }
}
</style>
