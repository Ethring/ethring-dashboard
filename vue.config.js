const chainWebpack = (config) => {
    // Найти правило для обработки файлов SASS/SCSS, SVG, MJS
    const sassRule = config.module.rule('sass');
    const svgRule = config.module.rule('svg');
    const mjsRule = config.module.rule('mjs');

    // Очистить существующие загрузчики
    sassRule.uses.clear();
    svgRule.uses.clear();
    mjsRule.uses.clear();

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

    // mjsRule
    //     .test(/\.[cm]js$/)
    //     .include.add(/node_modules/)
    //     .end()
    //     .type('javascript/auto');

    config.module
        .rule('js')
        .test(/\.js$/)
        .exclude.add(/node_modules/) // исключаем node_modules
        .end()
        .use('babel-loader')
        .loader('babel-loader')
        .end();

    config.module
        .rule('typescript')
        .test(/\.(js|jsx|ts|tsx)$/)
        // add @cosmos-kit to exclude node_modules
        .include.add(/@cosmos-kit/)
        .end()
        .include.add(/cosmjs-types/) // Include cosmjs-types package
        .end()
        .use('babel-loader')
        .loader('babel-loader')
        .options({
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        });

    config.module
        .rule('protobuf')
        .test(/\.proto$/)
        .use('protobuf-loader')
        .loader('protobuf-loader')
        .end();

    // Add a rule for all @cosmjs/ packages
    config.module
        .rule('cosmjs-packages')
        .test(/@cosmjs[\\/]/) // Match any package under @cosmjs
        .use('babel-loader')
        .loader('babel-loader')
        .end()
        .exclude // Exclude JSON files from processing
        .add(/@cosmjs[\\/].*\.json$/);

    // Add a rule for ES6 modules in @walletconnect packages
    config.module
        .rule('walletconnect-packages')
        .test(/@walletconnect[\\/].*\.js$/)
        .use('babel-loader')
        .loader('babel-loader')
        .options({
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            esmodules: true, // Use ES modules target for modern browsers
                        },
                    },
                ],
            ],
        });
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
                additionalData: `@import "@/assets/styles/colors.scss";`,
            },
        },
    },
};

module.exports = config;
