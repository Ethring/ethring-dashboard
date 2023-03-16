<template>
  <div class="tokens__item-header">
    <div class="name">{{ item.name }}</div>
  </div>
</template>
<script>
export default {
  name: "TokensItemHeader",
  props: {
    item: {
      required: true,
    },
  },
};
</script>
<style lang="scss" scoped>
.tokens__item-header {
  display: flex;
  align-items: center;
  padding: 0 10px;
  min-height: 73px;
  margin-bottom: 5px;
  border-bottom: 1px dashed #9ca6c6;

  .name {
    text-transform: uppercase;
    color: $colorBlack;
    font-size: 18px;
    font-family: "Poppins_SemiBold";
  }
}

body.dark {
  .tokens__item-header {
    .name {
      color: $colorWhite;
    }
  }
}
</style>
