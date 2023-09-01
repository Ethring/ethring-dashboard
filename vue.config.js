const chainWebpack = (config) => {
    // Найти правило для обработки файлов SASS/SCSS, SVG, MJS
    const sassRule = config.module.rule('sass');
    const svgRule = config.module.rule('svg');
    const mjsRule = config.module.rule('mjs');
    const wcRule = config.module.rule('walletConnect');

    // Очистить существующие загрузчики
    sassRule.uses.clear();
    svgRule.uses.clear();
    mjsRule.uses.clear();
    wcRule.uses.clear();

    svgRule.delete('type');
    svgRule.delete('generator');

    // Добавить нужные загрузчики (включая vue-svg-loader)
    svgRule.use('vue-loader').loader('vue-loader-v16').end().use('vue-svg-loader').loader('vue-svg-loader');

    // Добавить нужные загрузчики (включая sass-loader)
    sassRule
        .use('vue-style-loader')
        .loader('vue-style-loader')
        .end()
        .use('css-loader')
        .loader('css-loader')
        .end()
        .use('sass-loader')
        .loader('sass-loader')
        .end();

    mjsRule
        .test(/\.[cm]js$/)
        .include.add(/node_modules/)
        .end()
        .type('javascript/auto');
    wcRule
        .test(/node_modules[\\/]@walletconnect/)
        .use('babel-loader')
        .loader('babel-loader');
};

const config = {
    publicPath: '/',
    parallel: false,
    configureWebpack: {
        devtool: 'source-map',
    },
    lintOnSave: process.env.NODE_ENV !== 'production',
    runtimeCompiler: true,
    transpileDependencies: ['@metamask/utils'],
    chainWebpack,
    devServer: {
        historyApiFallback: true,
        https: process.env.NODE_ENV === 'production',
    },
    productionSourceMap: process.env.NODE_ENV !== 'production',
    css: {
        loaderOptions: {
            sass: {
                additionalData: `@import "@/assets/styles/colors.scss";
                    @import "@/assets/styles/variables";`,
            },
        },
    },
};

module.exports = config;
