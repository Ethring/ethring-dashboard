<template>
  <div class="swap">
    <Head />
    <div class="swap-page">
      <div class="swap-page__title">Swap</div>
    </div>
  </div>
</template>
<script>
import Head from "@/components/app/Head";

export default {
  name: "Swap",
  components: {
    Head,
  },
};
</script>
<style lang="scss" scoped>
.swap {
  @include pageStructure;

  .swap-page {
    @include pageFlexColumn;

    &__title {
      color: $colorBlack;
      font-size: 32px;
      font-family: "Poppins_SemiBold";
    }
  }
}

body.dark {
  .swap {
    .swap-page {
      &__title {
        color: $colorWhite;
      }
    }
  }
}
</style>
