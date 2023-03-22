<template>
  <div class="app-wrap">
    <Sidebar />
    <router-view />
  </div>
</template>
<script>
import Sidebar from "@/components/app/Sidebar";
import { onMounted } from "vue";
import { useStore } from "vuex";

export default {
  name: "App",
  components: {
    Sidebar,
  },
  setup() {
    const store = useStore();

    onMounted(async () => {
      await store.dispatch("networks/init");
      if (window.ethereum?.selectedAddress) {
        await store.dispatch("metamask/connectToMetamask");
      }
    });
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
