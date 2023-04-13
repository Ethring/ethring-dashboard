<template>
  <div class="swap-not-working">Swap under maintenance</div>
</template>
<script>
export default {
  name: "SwapNotWorking",
};
</script>
<style lang="scss" scoped>
.swap-not-working {
  font-weight: 600;
  font-size: 32px;
  font-family: "Poppins_Regular";
  color: $colorBlack;
  height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

body.dark {
  .swap-not-working {
    color: $colorWhite;
  }
}
</style>
