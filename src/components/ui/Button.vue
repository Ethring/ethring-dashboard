<template>
  <button :class="{ xl, disabled }" class="button" :disabled="disabled">
    {{ title }}
  </button>
</template>
<script>
export default {
  name: "Button",
  props: {
    xl: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
  },
};
</script>
<style lang="scss" scoped>
.button {
  min-width: 80px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  outline: none;
  background: $colorBlack;
  color: $colorWhite;
  font-family: "Poppins_SemiBold";
  // font-weight: 700;
  font-size: 14px;
  cursor: pointer;

  &.xl {
    font-size: 20px;
    font-family: "Poppins_SemiBold";
  }

  @include animateEasy;

  &:hover {
    background: $colorWhite;
    color: $colorBlack;
  }

  &.disabled {
    background: $colorLightGreen;

    color: #73b1b1;
  }
}

body.dark {
  .button {
    background: $colorBrightGreen;
    color: $colorBlack;

    &.disabled {
      background: $colorDarkPanel;

      color: #486060;
    }

    &:hover {
      background: $colorBlack;
      color: $colorWhite;
    }
  }
}
</style>
