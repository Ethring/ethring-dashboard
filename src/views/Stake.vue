<template>
  <div class="stake">
    <Head />
    <div class="stake-page">
      <div class="stake-page__title">Stake</div>
    </div>
  </div>
</template>
<script>
import Head from "@/components/app/Head";

export default {
  name: "Stake",
  components: {
    Head,
  },
};
</script>
<style lang="scss" scoped>
.stake {
  @include pageStructure;

  .stake-page {
    @include pageFlexColumn;

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
