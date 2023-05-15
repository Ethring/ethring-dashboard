const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  publicPath: "./",
  parallel: false,
  lintOnSave: process.env.NODE_ENV !== "production",
  runtimeCompiler: true,
  chainWebpack: (config) => {
    const svgRule = config.module.rule("svg");

    svgRule.uses.clear();
    svgRule.delete("type");
    svgRule.delete("generator");

    svgRule
      .use("vue-loader")
      .loader("vue-loader-v16")
      .end()
      .use("vue-svg-loader")
      .loader("vue-svg-loader");
  },
  configureWebpack: {
    plugins: [
      new SentryWebpackPlugin({
        org: "citadel",
        project: "zomet-dashboard",
        include: "./",
        ignore: ['node_modules'],
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
    devtool: "source-map",
  },
  devServer: {
    https: true,
  },
  productionSourceMap: process.env.NODE_ENV !== "production",
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
            @import "@/assets/styles/colors.scss";
          `,
      },
    },
  },
};
