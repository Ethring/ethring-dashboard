import store from "@/store";
import { UIConfig } from "@/config/ui";

export default async (to, from, next) => {
  const metamaskConnect = store.getters["metamask/metamaskConnector"];

  if (to.meta.isAuth && !metamaskConnect.network) {
    // return next({ name: "main" });
  }

  if (to.meta.isSwap && !UIConfig[metamaskConnect.network].swap) {
    return next({ name: "main" });
  }

  next();
};
