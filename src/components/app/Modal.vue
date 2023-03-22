<template>
  <div
    :style="{
      position,
      marginLeft: `${marginLeft}px`,
    }"
    class="modal"
    @click="$emit('close')"
  >
    <div
      :style="{
        width,
        height,
      }"
      class="modal__content"
      @click.stop="() => {}"
    >
      <div class="modal__content-close">
        <closeSvg @click="$emit('close')" />
      </div>
      <div class="modal__content-title">{{ title }}</div>
      <div class="modal__content-line" />
      <div class="modal__content-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
import closeSvg from "@/assets/icons/app/close.svg";

export default {
  name: "Modal",
  components: {
    closeSvg,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      default: "fixed",
    },
    width: {
      type: String,
      default: "",
    },
    height: {
      type: String,
      default: "",
    },
    marginLeft: {
      type: String,
      default: "0",
    },
  },
};
</script>

<style lang="scss" scoped>
.modal {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  overflow: auto;

  &__content {
    position: relative;
    width: 100%;
    height: 100%;
    background: $colorWhite;
    border-radius: 16px;
    padding: 10px 20px 20px 20px;
    box-sizing: border-box;
  }

  &__content-title {
    font-size: 24px;
    font-family: "Poppins_SemiBold";
  }

  &__content-line {
    margin: 10px 0;
    border: 1px dashed #ccd5f0;
  }

  &__content-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 90%;
  }

  &__content-close {
    position: absolute;
    right: 20px;
    top: 20px;
    cursor: pointer;

    @include animateEasy;

    &:hover {
      opacity: 0.7;
    }

    svg {
      fill: #586897;
    }
  }
}

body.dark {
  .modal {
    &__content {
      background: $colorLightBgGreen;
    }

    &__content-title {
      color: $themeGreen;
    }
  }
}
</style>
