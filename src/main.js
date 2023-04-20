import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "@/assets/styles/index.scss";
import { i18n } from "@/plugins/i18n";
import VueClickAway from "vue3-click-away";
import { vue3Debounce } from "vue-debounce";

createApp(App)
  .directive("debounce", vue3Debounce({ lock: true }))
  .use(store)
  .use(VueClickAway)
  .use(router)
  .use(i18n)
  .mount("#app");
