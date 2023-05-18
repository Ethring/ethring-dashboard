export const cutAddress = (address) => {
  if (!address || typeof address !== "string") {
    return "";
  }

  if (address.length < 25) {
    return address;
  }
  return `${address.slice(0, 10)}***${address.slice(-6)}`;
};

export const getTokenIcon = (code) => {
  return `//${process.env.VUE_APP_HOST}/cryptofont/SVG/${code}.svg`;
};

export const getTxUrl = (net, hash) => {
  if (!hash || typeof hash !== "string") {
    return "";
  }

  const networks = {
    bsc: `https://bscscan.com/tx/${hash}`,
    eth: `https://etherscan.io/tx/${hash}`,
    polygon: `https://polygonscan.com/tx/${hash}`,
    optimism: `https://optimistic.etherscan.io/tx/${hash}`,
    arbitrum: `https://arbiscan.io/tx/${hash}`,
    avalanche: `https://snowtrace.io/tx/${hash}`,
    evmoseth: `https://www.mintscan.io/evmos/txs/${hash}`,
  };

  if (!networks[net]) {
    return "";
  }

  return networks[net];
};

export const tokenIconPlaceholder = (tokenName) => {
  const name = tokenName.trim().split(" ");
  const nameAbbr = [];

  if (name.length > 1) {
    nameAbbr[0] = name[0][0].toUpperCase();
    nameAbbr[1] = name[1][0].toUpperCase();
  } else if (name[0].length === 1) {
    nameAbbr[0] = name[0][0].toUpperCase();
    nameAbbr[1] = name[0][0].toUpperCase();
  } else {
    nameAbbr[0] = name[0][0].toUpperCase();
    nameAbbr[1] = name[0][1].toUpperCase();
  }

  return nameAbbr;
};

export const copyToClipboard = (text) => {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);

  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
};
