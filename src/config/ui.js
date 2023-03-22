const defaultSidebarItems = [
  { component: "mainSvg", title: "Main", key: "main", to: "/main" },
  { component: "sendSvg", title: "Send", key: "send", to: "/send" },
];

export const UIConfig = {
  bsc: {
    sidebar: [
      ...defaultSidebarItems,
      { component: "stakeSvg", title: "Stake", key: "stake", to: "/stake" },
      { component: "swapSvg", title: "Swap", key: "swap", to: "/swap" },
    ],
    swap: {
      component: "PancakeSwap",
    },
  },
  eth: {
    sidebar: [
      ...defaultSidebarItems,
      { component: "swapSvg", title: "Swap", key: "swap", to: "/swap" },
    ],
    swap: {
      component: "UniSwap",
    },
  },
  polygon: {
    sidebar: [
      ...defaultSidebarItems,
      { component: "swapSvg", title: "Swap", key: "swap", to: "/swap" },
    ],
    swap: {
      component: "DefaultSwap",
    },
  },
  optimism: {
    sidebar: [...defaultSidebarItems],
  },
  avalanche: {
    sidebar: [
      ...defaultSidebarItems,
      { component: "swapSvg", title: "Swap", key: "swap", to: "/swap" },
    ],
    swap: {
      component: "DefaultSwap",
    },
  },
  arbitrum: {
    sidebar: [...defaultSidebarItems],
  },
  evmoseth: {
    sidebar: [...defaultSidebarItems],
  },
};
