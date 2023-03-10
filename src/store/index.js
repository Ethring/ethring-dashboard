import createPersistedState from "vuex-persistedstate";
import { createStore } from "vuex";
import metamask from "./metamask";
import networks from "./networks";
import tokens from "./tokens";
import app from "./app";

const dataState = createPersistedState({
  key: "citadelPoint",
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  },
  paths: ["app.showBalance"],
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
  },
  plugins: [dataState],
});
