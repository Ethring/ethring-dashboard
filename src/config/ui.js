const defaultSidebarItems = [
  { component: "mainSvg", title: "Main", key: "main", to: "/main" },
  { component: "swapSvg", title: "Swap", key: "swap", to: "/swap" },
  // { component: "sendSvg", title: "Send", key: "send", to: "/send" },
];

export const UIConfig = {
  bsc: {
    sidebar: [
      ...defaultSidebarItems,
      // { component: "stakeSvg", title: "Stake", key: "stake", to: "/stake" },
    ],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
  eth: {
    sidebar: [...defaultSidebarItems],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
  polygon: {
    sidebar: [...defaultSidebarItems],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
  optimism: {
    sidebar: [...defaultSidebarItems],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
  avalanche: {
    sidebar: [...defaultSidebarItems],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
  arbitrum: {
    sidebar: [...defaultSidebarItems],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
  evmoseth: {
    sidebar: [...defaultSidebarItems],
    send: {
      component: "SimpleSend",
    },
    swap: {
      component: "SimpleSwap",
    },
  },
};
