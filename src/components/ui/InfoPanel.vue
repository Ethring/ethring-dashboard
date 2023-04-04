<template>
  <div :class="[type]" class="info-panel">
    <component :is="`${type}Svg`" />
    <div v-if="title" class="info-panel__title">{{ title }}</div>
    <a v-if="hash" :href="hash" target="_blank" class="info-panel__link">{{
      hash
    }}</a>
  </div>
</template>
<script>
import errorSvg from "@/assets/icons/dashboard/cancel.svg";
import successSvg from "@/assets/icons/dashboard/success.svg";
import warningSvg from "@/assets/icons/dashboard/warning.svg";
import infoSvg from "@/assets/icons/dashboard/info.svg";

export default {
  name: "InfoPanel",
  props: {
    title: {
      type: String,
    },
    hash: {
      type: String,
    },
    type: {
      type: String,
      default: "error",
    },
  },
  components: {
    errorSvg,
    successSvg,
    warningSvg,
    infoSvg,
  },
};
</script>
<style lang="scss" scoped>
.info-panel {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
  border-radius: 8px;
  background: $colorLightOrange;
  border: 1px solid $colorRed;
  color: $colorRed;
  font-family: "Poppins_Regular";
  font-size: 16px;

  svg {
    fill: $colorRed;
  }

  &.success {
    background: #e8f0e4;
    border: 1px solid #038d00;
    color: #038d00;

    svg {
      fill: #038d00;
    }

    .info-panel__link {
      color: #038d00;
    }
  }

  &.warning {
    background: rgba(255, 107, 0, 0.1);
    border: 1px solid #ff6b00;
    color: #ff6b00;

    svg {
      fill: #ff6b00;
    }

    .info-panel__link {
      color: #ff6b00;
    }
  }

  &.info {
    background: rgba(0, 131, 159, 0.1);
    border: 1px solid #00839f;
    color: #00839f;

    svg {
      fill: #00839f;
    }

    .info-panel__link {
      color: #00839f;
    }
  }

  &__link {
    margin-left: 7px;
    text-decoration: underline;
    color: $colorRed;
  }

  &__title {
    margin-left: 10px;
  }
}

body.dark {
  .info-panel {
    border: 1px solid transparent;

    background: rgba(228, 69, 93, 0.1);
    border: 1px solid $colorRed;

    &.success {
      background: rgba(4, 182, 0, 0.1);
      border: 1px solid #04b600;
      color: #04b600;

      svg {
        fill: #04b600;
      }

      .info-panel__link {
        color: #04b600;
      }
    }

    &.warning {
      background: rgba(246, 149, 2, 0.1);
      border: 1px solid #f69502;

      svg {
        fill: #f69502;
      }

      .info-panel__link {
        color: #f69502;
      }
    }

    &.info {
      background: rgba(2, 231, 246, 0.1);
      border: 1px solid #02e7f6;

      svg {
        fill: #02e7f6;
      }

      .info-panel__link {
        color: #02e7f6;
      }
    }

    &__link {
      color: $colorRed;
    }
  }
}
</style>
