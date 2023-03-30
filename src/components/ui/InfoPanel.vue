<template>
  <div :class="{ success }" class="info-panel">
    <cancelSvg v-if="!hash" />
    <div v-if="title" class="info-panel__title">{{ title }}</div>
    <a v-if="hash" :href="hash" target="_blank" class="info-panel__link"
      >Transaction ID</a
    >
  </div>
</template>
<script>
import cancelSvg from "@/assets/icons/dashboard/cancel.svg";

export default {
  name: "InfoPanel",
  props: {
    title: {
      type: String,
    },
    hash: {
      type: String,
    },
    success: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    cancelSvg,
  },
};
</script>
<style lang="scss" scoped>
.info-panel {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background: $colorLightOrange;
  border: 1px solid $colorRed;
  color: $colorRed;
  font-family: "Poppins_Regular";
  font-size: 16px;

  &.success {
    background: #e8f0e4;
    border: 1px solid $themeGreen;
  }

  &__link {
    text-decoration: underline;
    color: $colorBlack;
  }

  &__title {
    margin-left: 10px;
  }
}

body.dark {
  .info-panel {
    border: 1px solid transparent;

    &.success {
      background: $colorDarkGreen;
    }

    &__link {
      color: $colorWhite;
    }
  }
}
</style>
