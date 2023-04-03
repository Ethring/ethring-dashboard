<template>
  <div class="logo">
    <div class="logo__round">
      <logoSvg />
    </div>
    <div class="logo__text">Z<span>O</span>M<span>E</span>T</div>
  </div>
</template>
<script>
import logoSvg from "@/assets/icons/app/logohead.svg";

export default {
  name: "Logo",
  components: {
    logoSvg,
  },
};
</script>
<style lang="scss" scoped>
.logo {
  display: flex;
  align-items: center;

  &__round {
    margin-right: 10px;
    // border-radius: 50%;
    // width: 40px;
    // height: 40px;
    // display: flex;
    // justify-content: center;
    // align-items: center;
    // background: $colorBrightGreen;
    // margin-right: 5px;

    svg {
      // fill: $colorWhite;
    }
  }

  &__text {
    font-size: 24px;
    font-family: "Poppins_Light";
    color: $colorWhite;

    span {
      color: $colorBrightGreen;
      font-family: "Poppins_SemiBold";
    }
  }
}

body.dark {
  .logo {
    &__round {
      // background: $colorWhite;

      svg {
        // fill: $colorBlack;
      }
    }

    &__text {
      color: $colorWhite;

      span {
        color: $themeGreen;
      }
    }
  }
}
</style>
