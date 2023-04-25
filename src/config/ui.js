const defaultSidebarItems = [
  { component: "mainSvg", title: "Main", key: "main", to: "/main" },
  { component: "stakeSvg", title: "Send", key: "send", to: "/send" },
  { component: "swapSvg", title: "Swap", key: "swap", to: "/swap" },
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
