<template>
  <div class="empty-list">
    <!-- <emptyListSvg v-if="false" /> -->
    <div class="empty-list__title">{{ title }}</div>
  </div>
</template>
<script>
// import emptyListSvg from "@/assets/icons/dashboard/empty.svg";

export default {
  name: "EmptyList",
  components: {
    // emptyListSvg,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
  },
};
</script>
<style lang="scss" scoped>
.empty-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  svg {
    stroke: $colorBlack;
  }

  &__title {
    font-weight: 600;
    font-size: 32px;
    font-family: "Poppins_Regular";
    color: $colorBlack;
  }
}

body.dark {
  .empty-list {
    &__title {
      color: $colorWhite;
    }

    svg {
      stroke: $themeGreen;
    }
  }
}
</style>
