<template>
  <div class="stake">
    <div class="stake-page">
      <div class="stake-page__title">Stake</div>
    </div>
  </div>
</template>
<script>
export default {
  name: "Stake",
  components: {},
};
</script>
<style lang="scss" scoped>
.stake {
  @include pageStructure;

  .stake-page {
    @include pageFlexColumn;
    height: calc(100vh - 125px);

    &__title {
      color: $colorBlack;
      font-size: 32px;
      font-family: "Poppins_SemiBold";
    }
  }
}

body.dark {
  .stake {
    background: rgb(12, 13, 23);

    .stake-page {
      &__title {
        color: $colorWhite;
      }
    }
  }
}
</style>
