<template>
  <div class="sidebar">
    <Logo class="sidebar__logo" />
    <SidebarList />
    <Socials class="sidebar__socials" />
  </div>
</template>
<script>
import Logo from "./Logo";
import Socials from "./Socials";
import SidebarList from "./SidebarList";

export default {
  name: "Sidebar",
  components: {
    Logo,
    SidebarList,
    Socials,
  },
};
</script>
<style lang="scss" scoped>
.sidebar {
  position: fixed;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-top: 130px;
  width: 260px;
  height: 100vh;
  padding-left: 25px;
  border-right: 1px solid $borderLight;
  background: $colorDarkPanel;

  &__socials {
    position: absolute;
    bottom: 25px;
  }

  &__logo {
    position: absolute;
    left: 25px;
    top: 40px;
  }
}

body.dark {
  .sidebar {
    border-right: 1px solid $borderDark;
    // background: $colorDarkBgGreen;
  }
}
</style>
