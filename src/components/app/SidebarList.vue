<template>
  <div class="sidebar-list">
    <router-link
      v-for="(item, ndx) in menu"
      :key="ndx"
      :to="item.to"
      class="sidebar-list__item"
    >
      <div class="sidebar-list__item-icon">
        <component v-if="item.component" :is="item.component" />
      </div>
      <div class="sidebar-list__item-title">
        {{ $t(`sidebar.${item.key}`) }}
      </div>
    </router-link>
  </div>
</template>
<script>
import mainSvg from "@/assets/icons/sidebar/main.svg";
import swapSvg from "@/assets/icons/sidebar/swap.svg";
import stakeSvg from "@/assets/icons/sidebar/stake.svg";
import sendSvg from "@/assets/icons/sidebar/send.svg";

import useConnect from "@/compositions/useConnect";

import { UIConfig } from "@/config/ui";

import { computed } from "vue";

export default {
  name: "SidebarList",
  components: {
    mainSvg,
    swapSvg,
    stakeSvg,
    sendSvg,
  },
  setup() {
    const { activeConnect } = useConnect();

    const menu = computed(() => {
      if (!activeConnect.value.network) {
        return [];
      }

      return UIConfig[activeConnect.value.network].sidebar;
    });

    return {
      menu,
    };
  },
};
</script>
<style lang="scss" scoped>
.sidebar-list {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: "Poppins_Light";
  font-size: 20px;

  &__item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    text-decoration: none;
    color: $colorBlack;
    cursor: pointer;

    @include animateEasy;

    &:hover {
      opacity: 0.5;
    }

    &.router-link-exact-active {
      font-family: "Poppins_SemiBold";

      svg {
        stroke: $colorMainBlue;
      }
    }

    svg {
      stroke: $colorBlack;
      transform: scale(0.8);
    }
  }

  &__item-icon {
    display: flex;
    justify-content: center;
    width: 32px;
  }

  &__item-title {
    margin-left: 10px;
  }
}

body.dark {
  .sidebar-list {
    &__item {
      color: $colorLightBrown;

      &.router-link-exact-active {
        color: $colorWhite;

        svg {
          stroke: $themeGreen;
        }
      }

      svg {
        stroke: $colorLightBrown;
      }
    }
  }
}
</style>
