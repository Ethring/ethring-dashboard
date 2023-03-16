<template>
  <div class="logo">
    <div class="logo__round">
      <logoSvg />
    </div>
    <div class="logo__text">P<span>O</span>I<span>N</span>T</div>
  </div>
</template>
<script>
import logoSvg from "@/assets/icons/app/logo.svg";

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
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: $colorBlack;
    margin-right: 5px;

    svg {
      fill: $colorWhite;
    }
  }

  &__text {
    font-size: 24px;
    font-family: "Poppins_Light";
    color: $colorBlack;

    span {
      color: $colorMainBlue;
      font-family: "Poppins_SemiBold";
    }
  }
}

body.dark {
  .logo {
    &__round {
      background: $colorWhite;

      svg {
        fill: $colorBlack;
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
