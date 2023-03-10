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
