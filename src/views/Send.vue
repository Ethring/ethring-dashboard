<template>
  <div class="send">
    <Head />
    <div class="send-page">
      <div class="send-page__title">Send</div>
      <div class="send-page__wrap">
        <SimpleSend />
      </div>
    </div>
  </div>
</template>
<script>
import SimpleSend from "@/components/dynamic/send/SimpleSend";
import Head from "@/components/app/Head";

export default {
  name: "Send",
  components: {
    Head,
    SimpleSend,
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
      margin-bottom: 30px;
    }

    &__wrap {
      display: flex;
      justify-content: center;
      height: calc(100vh - 200px);
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
