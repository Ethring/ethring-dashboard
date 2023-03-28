import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "@/assets/styles/index.scss";
import { i18n } from "@/plugins/i18n";
import VueClickAway from "vue3-click-away";

createApp(App).use(store).use(VueClickAway).use(router).use(i18n).mount("#app");
