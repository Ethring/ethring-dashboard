import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "@/assets/styles/index.scss";
import { i18n } from "@/plugins/i18n";
import VueClickAway from "vue3-click-away";
import { vue3Debounce } from "vue-debounce";
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/browser";

const app = createApp(App);
app
  .directive("debounce", vue3Debounce({ lock: true }))
  .use(store)
  .use(VueClickAway)
  .use(router)
  .use(i18n)
  .mount("#app");

if (process.env.VUE_APP_SENTRY_DSN) {
  Sentry.init({
    app,
    dsn: process.env.VUE_APP_SENTRY_DSN,
    tunnel: new URL(process.env.VUE_APP_SENTRY_DSN).origin + "/tunnel",
    release: process.env.VUE_APP_RELEASE,
    environment: process.env.NODE_ENV,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      }),
    ],
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.5,
  });
}
