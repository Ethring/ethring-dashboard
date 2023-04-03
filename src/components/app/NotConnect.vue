<template>
  <div class="not-connect" @click="connectToMetamask">
    <div class="not-connect__add">
      <plusSvg />
    </div>
    <div class="title">{{ $t("connect.emptyTitle") }}</div>
  </div>
</template>
<script>
import plusSvg from "@/assets/icons/dashboard/plus.svg";
import { useStore } from "vuex";

export default {
  name: "NotConnect",
  components: {
    plusSvg,
  },
  setup() {
    const store = useStore();

    const connectToMetamask = async () => {
      await store.dispatch("metamask/connectToMetamask");
    };

    return {
      connectToMetamask,
    };
  },
};
</script>
<style lang="scss" scoped>
.not-connect {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  @include animateEasy;

  &:hover {
    opacity: 0.7;
  }

  svg {
    stroke: $colorLightBlue;
  }

  &__add {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $colorLightGreen;
  }

  .title {
    font-family: "Poppins_Light";
    font-size: 14px;
    width: 162px;
    margin-left: 10px;
    color: $colorLightBlue;
  }
}

body.dark {
  .not-connect {
    &__add {
      background: $colorLightGreenGray;
    }

    svg {
      stroke: $themeGreen;
    }

    .title {
      color: $colorWhite;
    }
  }
}
</style>
