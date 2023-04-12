<template>
  <div class="logo" @click="$router.push('/kit')">
    <div class="logo__round">
      <logoSvg />
    </div>
    <!-- <div class="logo__text">Z<span>O</span>M<span>E</span>T</div> -->
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
  cursor: pointer;

  &__round {
    margin-right: 10px;

    svg {
      fill: $colorWhite;
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
    &__text {
      color: $colorWhite;

      span {
        color: $colorBrightGreen;
      }
    }
  }
}
</style>
