<template>
  <div class="app-wrap">
    <Sidebar />
    <router-view />
  </div>
</template>
<script>
import Sidebar from "@/components/app/Sidebar";

export default {
  name: "App",
  components: {
    Sidebar,
  },
};
</script>

<style lang="scss">
@import "./assets/styles/colors.scss";

html,
body {
  padding: 0;
  margin: 0;
  background: $bgLight;
  transition: all 0.3s ease-in-out;

  &.dark {
    background: $bgDark;
  }
}

.app-wrap {
  display: flex;
}
</style>
