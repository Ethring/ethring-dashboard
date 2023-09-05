const IS_PROD = process.env.NODE_ENV === 'production';

//  ===========================================================================
// * Утилита для настройки базового правила Webpack для обработки различных типов модулей
//  ===========================================================================
const configureGeneralRule = (config, { name, exclude }) => {
    const BABEL_OPTIONS = {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        plugins: ['@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-optional-chaining'],
        cacheDirectory: true, // Включение кэширования для ускорения процесса сборки
    };

    const generalRule = config.module.rule('general').test(/\.(cjs|mjs|js|jsx|ts|tsx)$/);

    // Добавляем новый модуль для обработки
    generalRule.include.add(new RegExp(name));

    // Если предоставлен паттерн для исключения, то добавляем его
    if (exclude) {
        generalRule.exclude.add(new RegExp(exclude));
    }

    // Устанавливаем опции для babel-loader
    generalRule.use('babel-loader').loader('babel-loader').options(BABEL_OPTIONS);
};

//  ===========================================================================
// * Утилита для настройки правил Webpack для обработки по типам модулей (css, svg, sass и т.д.)
//  ===========================================================================
const configureRule = (config, ruleName, loaders) => {
    const rule = config.module.rule(ruleName);
    rule.uses.clear();
    rule.delete('type').delete('generator');

    loaders.forEach((loader) => {
        rule.use(loader.name)
            .loader(loader.name)
            .options(loader.options || {});
    });
};

const chainWebpack = (config) => {
    configureRule(config, 'sass', [{ name: 'vue-style-loader' }, { name: 'css-loader' }, { name: 'sass-loader' }]);
    configureRule(config, 'svg', [{ name: 'vue-loader-v16' }, { name: 'vue-svg-loader' }]);

    const modulesToInclude = [
        // { name: '@cosmos-kit' },
        // { name: 'cosmjs-types' },
        { name: '@metamask/utils' },
        { name: '@walletconnect' },
        { name: '@vueuse/core' },
        // { name: '@cosmjs[\\\\/]', exclude: '@cosmjs[\\\\/].*\\.json$' },
    ];

    // Применяем общие правила для каждого указанного модуля
    for (const moduleConfig of modulesToInclude) {
        configureGeneralRule(config, moduleConfig);
    }
};

module.exports = {
    publicPath: '/',
    parallel: false,
    configureWebpack: {
        devtool: 'source-map',
    },
    lintOnSave: IS_PROD,
    runtimeCompiler: true,
    chainWebpack,
    devServer: {
        historyApiFallback: true,
        https: IS_PROD,
    },
    productionSourceMap: IS_PROD,
    css: {
        loaderOptions: {
            sass: {
                additionalData: `@import "@/assets/styles/colors.scss";`,
            },
        },
    },
};
