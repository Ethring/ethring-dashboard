import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";

const routes = [
  {
    path: "/main",
    name: "main",
    component: Dashboard,
  },
  {
    path: "/swap",
    name: "swap",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Swap.vue"),
  },
  {
    path: "/stake",
    name: "stake",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Stake.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "notFound",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
