import createPersistedState from "vuex-persistedstate";
import { createStore } from "vuex";
import metamask from "./metamask";
import networks from "./networks";
import tokens from "./tokens";
import app from "./app";
import oneInchSwap from "./1inch/oneInchSwap";

const dataState = createPersistedState({
  key: "citadelPoint",
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  },
  paths: ["app.showBalance", "tokens.favourites"],
});

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    app,
    metamask,
    networks,
    tokens,
    oneInchSwap,
  },
  plugins: [dataState],
});
