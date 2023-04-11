<template>
  <div class="app-wrap">
    <Sidebar />
    <div class="app-wrap__head">
      <Head />
    </div>
    <router-view />
  </div>
</template>
<script>
import Sidebar from "@/components/app/Sidebar";
import Head from "@/components/app/Head";
import { onMounted } from "vue";
import { useStore } from "vuex";

export default {
  name: "App",
  components: {
    Sidebar,
    Head,
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

  @include animateEasy;

  &.dark {
    background: $bgDark;
  }
}

.app-wrap {
  display: flex;

  &__head {
    position: fixed;
    top: 0;
    right: 0;
    width: calc(100% - 260px);
    box-sizing: border-box;
    padding: 41px 150px 31px;
    z-index: 11;
    background: $colorWhite;
  }
}

body.dark {
  .app-wrap {
    &__head {
      background: #0c0d17;
    }
  }
}
</style>
