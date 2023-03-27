<template>
  <button :class="{ xl }" class="button">
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
  background: $colorMainBlue;
  color: $colorWhite;
  font-family: "Poppins_Regular";
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;

  &.xl {
    font-size: 20px;
    font-family: "Poppins_SemiBold";
  }

  @include animateEasy;

  &:hover {
    background: $colorBlack;
    color: $colorWhite;
  }
}

body.dark {
  .button {
    background: $colorLightGreen;
    color: $colorBlack;

    &:hover {
      background: $colorLightBrown;
      color: $colorBlack;
    }
  }
}
</style>
