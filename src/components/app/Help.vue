<template>
  <div class="help">
    <div class="help__item">
      <settingsSvg />
    </div>
    <div class="help__item mt">?</div>
    <div class="help__item">
      <cardSvg class="card-svg" />
    </div>
  </div>
</template>
<script>
import settingsSvg from "@/assets/icons/dashboard/settings.svg";
import cardSvg from "@/assets/icons/dashboard/card.svg";

export default {
  name: "Help",
  components: {
    settingsSvg,
    cardSvg,
  },
};
</script>
<style lang="scss" scoped>
.help {
  display: flex;
  align-items: center;

  &__item {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: $colorSlimLightBlue;
    font-family: "Poppins_Regular";
    font-size: 24px;
    color: #486060;
    cursor: pointer;

    svg {
      fill: #486060;

      &.card-svg {
        fill: #486060;
      }
    }

    &.mt {
      margin: 0 10px;
    }
  }
}

body.dark {
  .help {
    &__item {
      background: $colorDarkGreenGray;
      color: $themeGreen;

      svg {
        fill: $themeGreen;

        &.card-svg {
          fill: $themeGreen;
        }
      }
    }
  }
}
</style>
