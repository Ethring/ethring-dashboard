import { defineConfig } from 'vite';

import { resolve } from 'path'; // * Path for resolving the paths

// * Plugins
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';

import EnvironmentPlugin from 'vite-plugin-environment';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // * Node Polyfills, for NodeJS modules

import packageJson from './package.json'; // * Package.json to get the version

// import chunkSizeControlPlugin from './plugins/chunkSizeControlPlugin';

const isProduction = process.env.NODE_ENV === 'production'; // Production environment
const isAnalyzeBundle = process.env.IS_ANALYZE === 'true'; // Analyze bundle size
const MAX_CHUNK_SIZE_PER_FILE = 3 * 1024 * 1024; // Default size limit: 3MB

export default defineConfig({
    base: '/',
    mode: process.env.NODE_ENV,
    define: {
        'process.env.APP_VERSION': JSON.stringify(packageJson.version) || '1.0.0',
    },
    // * ========= Settings for build (vite build) =========
    build: {
        manifest: true,
        minify: 'terser',
        cssMinify: 'lightningcss',
        sourcemap: !isProduction,
        chunkSizeWarningLimit: MAX_CHUNK_SIZE_PER_FILE,
        rollupOptions: {
            // EXCLUDE
            external: ['stargazejs/main/codegen/ibc', 'stargazejs/main/codegen/cosmos'],
            output: {
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: '[ext]/[name]-[hash].[ext]',
                manualChunks: {
                    vue: ['vue', 'vue-router', 'vuex', 'vue3-click-away', 'vue-debounce', '@vueuse/rxjs', '@vueuse/core'],
                    sentry: ['@sentry/vue', '@sentry/browser'],
                    mixpanel: ['mixpanel-browser'],
                    axios: ['axios', 'axios-extensions'],
                    utils: ['bignumber.js', 'lodash', 'moment', 'socket.io-client', '@osmonauts/helpers'],
                    'ant-design': ['ant-design-vue'],
                    'ant-design-icons': ['@ant-design/icons-vue'],
                    '@cosmology-cosmos-kit': ['@cosmos-kit/core'],
                    '@cosmology-wallets-keplr': ['@cosmos-kit/keplr', '@cosmos-kit/keplr-extension', '@cosmos-kit/keplr-mobile'],
                    '@cosmjs-stargate': ['@cosmjs/cosmwasm-stargate', '@cosmjs/stargate'],

                    // Stargazejs
                    '@cosmology-telescope-ibc-stargaze': ['stargazejs/main/codegen/ibc/bundle', 'stargazejs/main/codegen/ibc/client'],
                    '@cosmology-telescope-cosmos-stargaze': [
                        'stargazejs/main/codegen/cosmos/bundle',
                        'stargazejs/main/codegen/cosmos/client',
                    ],

                    // Osmosis
                    '@cosmology-telescope-ibc-osmosis': ['osmojs/dist/codegen/ibc/bundle', 'osmojs/dist/codegen/ibc/client'],
                    '@cosmology-telescope-cosmos-osmosis': ['osmojs/dist/codegen/cosmos/bundle', 'osmojs/dist/codegen/cosmos/client'],
                    '@cosmology-telescope-osmosis': ['osmojs/dist/codegen/osmosis/bundle', 'osmojs/dist/codegen/osmosis/client'],

                    '@web3-onboard-cores': ['@web3-onboard/core', '@web3-onboard/vue', '@web3-onboard/common'],
                    '@web3-onboard-wallets': ['@web3-onboard/injected-wallets', '@web3-onboard/coinbase', '@web3-onboard/ledger'],
                },
            },
        },
    },
    // * ========= Server (vite dev, vite preview) =========
    server: {
        host: '0.0.0.0',
        historyApiFallback: true,
        https: isProduction,
        compress: true,
    },

    // * ========= Resolve for imports =========
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@cosmology/helpers': '@osmonauts/helpers',
            'axios/lib': resolve(__dirname, './node_modules/axios/lib'),
        },
        extensions: ['.js', '.ts', '.vue', '.svg', 'json'],
    },

    // * ========= CSS Settings =========
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `
                    @import "@/assets/styles/colors.scss";
                    @import "@/assets/styles/variables";
                `,
            },
        },
    },

    // * ========= Plugins for Vite =========
    plugins: [
        vue({ isProduction: isProduction }),
        EnvironmentPlugin('all'),
        svgLoader({
            svgoConfig: {
                plugins: [
                    {
                        name: 'reusePaths',
                        active: true,
                    },
                ],
            },
        }),
        nodePolyfills({ include: ['buffer', 'crypto', 'path', 'stream', 'util'] }),
        VitePWA({
            mode: process.env.NODE_ENV,
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.js',
            injectManifest: {
                maximumFileSizeToCacheInBytes: 20000000,
            },
        }),
        Components({
            resolvers: [
                AntDesignVueResolver({
                    importStyle: false, // css in js
                }),
            ],
        }),
        // chunkSizeControlPlugin({ maxSize: MAX_CHUNK_SIZE_PER_FILE }), // TODO: Optimize this
        isAnalyzeBundle &&
            visualizer({
                open: true,
                gzipSize: true,
                brotliSize: true,
                bundle: true,
                sourcemap: true,
                filename: 'stats.html',
            }),

        // eslintPlugin(), // TURN ON FOR ESLINT_DEBUG = true
    ],
});
