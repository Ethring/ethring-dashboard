<template>
  <div class="send">
    <Head />
    <div class="send-page">
      <div class="send-page__title">Send</div>
    </div>
  </div>
</template>
<script>
import Head from "@/components/app/Head";

export default {
  name: "Send",
  components: {
    Head,
  },
};
</script>
<style lang="scss" scoped>
.send {
  @include pageStructure;

  .send-page {
    @include pageFlexColumn;

    &__title {
      color: $colorBlack;
      font-size: 32px;
      font-family: "Poppins_SemiBold";
    }
  }
}

body.dark {
  .send {
    .send-page {
      &__title {
        color: $colorWhite;
      }
    }
  }
}
</style>
