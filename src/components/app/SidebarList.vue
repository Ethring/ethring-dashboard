<template>
  <div class="sidebar-list">
    <router-link
      v-for="(item, ndx) in menu"
      :key="ndx"
      :to="item.to"
      class="sidebar-list__item"
    >
      <div class="sidebar-list__item-icon">
        <mainSvg v-if="item.key === 'main'" />
        <swapSvg v-if="item.key === 'swap'" />
        <stakeSvg v-if="item.key === 'stake'" />
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

export default {
  name: "SidebarList",
  components: {
    mainSvg,
    swapSvg,
    stakeSvg,
  },
  setup() {
    const menu = [
      { icon: "main", title: "Main", key: "main", to: "/main" },
      { icon: "swap", title: "Swap", key: "swap", to: "/swap" },
      { icon: "stake", title: "Stake", key: "stake", to: "/stake" },
    ];

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
    transition: all 0.3s ease-in-out;
    text-decoration: none;
    color: $colorBlack;
    cursor: pointer;

    &:hover {
      opacity: 0.5;
    }

    &.router-link-exact-active {
      font-family: "Poppins_SemiBold";
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
      color: $colorDarkGreen;

      &.router-link-exact-active {
        color: $colorWhite;

        svg {
          stroke: $themeGreen;
        }
      }

      svg {
        stroke: $colorDarkGreen;
      }
    }
  }
}
</style>
