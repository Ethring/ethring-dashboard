import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import guards from "./guards";

const routes = [
  {
    path: "/main",
    name: "main",
    component: Dashboard,
  },
  {
    path: "/swap",
    name: "swap",
    meta: {
      isAuth: true,
      isSwap: true,
    },
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Swap.vue"),
  },
  {
    path: "/stake",
    name: "stake",
    meta: {
      isAuth: true,
    },
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Stake.vue"),
  },
  {
    path: "/send",
    name: "send",
    meta: {
      isAuth: true,
    },
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Send.vue"),
  },
  {
    path: "/swap",
    name: "swap",
    meta: {
      isAuth: true,
    },
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Swap.vue"),
  },
  {
    path: "/kit",
    name: "kit",
    meta: {
      isAuth: true,
    },
    component: () => import(/* webpackChunkName: "about" */ "../views/Kit.vue"),
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
router.beforeEach(guards);

export default router;
