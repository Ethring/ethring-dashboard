<template>
  <button class="button">
    {{ title }}
  </button>
</template>
<script>
export default {
  name: "Button",
  props: {
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
  font-family: "Poppins_Regular";
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;

  &:hover {
    background: $colorMainBlue;
    color: $colorWhite;
  }
}

body.dark {
  .button {
    background: $colorLightGreenGray;
    color: $themeGreen;

    &:hover {
      background: $themeGreen;
      color: $colorBlack;
    }
  }
}
</style>
