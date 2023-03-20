export const cutAddress = (address) =>
  `${address.slice(0, 10)}***${address.slice(-6)}`;

export const getTokenIcon = (code) => {
  return `//${process.env.VUE_APP_HOST}/cryptofont/SVG/${code}.svg`;
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
