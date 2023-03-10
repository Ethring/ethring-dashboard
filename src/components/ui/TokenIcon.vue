<template>
  <div class="token-icon">
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
      <span>{{ iconPlaceholder[1] }}</span>
    </div>
  </div>
</template>
<script>
import { ref, computed } from "vue";
import { getTokenIcon, tokenIconPlaceholder } from "@/helpers/utils";

export default {
  name: "TokenIcon",
  props: {
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

  img {
    filter: brightness(0) invert(1);
  }

  &__placeholder {
    position: relative;
    width: 100%;
    height: 100%;

    & span {
      font-size: 14px;
      line-height: 17px;
      color: $colorWhite;
      font-family: "Poppins_Bold";
      position: absolute;
      top: 7px;
      left: 6px;

      &:last-child {
        top: 13px;
        left: 19px;
        right: 7px;
      }
    }
  }
}
</style>
