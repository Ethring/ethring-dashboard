<template>
  <div :class="{ dark }" class="token-icon">
    <img
      v-if="!showIconPlaceholder"
      :width="width"
      :height="height"
      :key="token?.code"
      :src="getTokenIcon(token?.code?.toLowerCase())"
      :alt="token?.name"
      @error="showIconPlaceholder = true"
      @load="showIconPlaceholder = false"
    />
    <div v-else class="token-icon__placeholder">
      <span>{{ iconPlaceholder[0] }}</span>
    </div>
  </div>
</template>
<script>
import { ref, computed, watch } from "vue";
import { getTokenIcon, tokenIconPlaceholder } from "@/helpers/utils";

export default {
  name: "TokenIcon",
  props: {
    dark: {
      type: Boolean,
      default: false,
    },
    width: {
      required: true,
    },
    height: {
      required: true,
    },
    token: {
      required: true,
    },
  },
  setup(props) {
    const showIconPlaceholder = ref(false);
    const iconPlaceholder = computed(() =>
      tokenIconPlaceholder(props.token.name)
    );

    watch(
      () => props.token,
      () => {
        showIconPlaceholder.value = false;
      }
    );

    return {
      showIconPlaceholder,
      getTokenIcon,
      iconPlaceholder,
      tokenIconPlaceholder,
    };
  },
};
</script>
<style lang="scss" scoped>
.token-icon {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;

  &.dark {
    img {
      filter: brightness(0) invert(0);
    }
  }

  img {
    filter: brightness(0) invert(1);
  }

  &__placeholder {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 1px;

    & span {
      font-size: 25px;
      line-height: 17px;
      color: $colorWhite;
      font-family: "Poppins_Bold";
    }
  }
}
</style>
