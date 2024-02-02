import { resolve } from 'path';

// * Vite
import { defineConfig } from 'vite';

// * Plugins
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { visualizer } from 'rollup-plugin-visualizer';

import { VitePWA } from 'vite-plugin-pwa';

// * Node Polyfills, for NodeJS modules
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// * Package JSON file
import packageJson from './package.json';

const isProduction = process.env.NODE_ENV === 'production';
const isAnalyzeBundle = process.env.IS_ANALYZE === 'true';

export default defineConfig({
    base: '/',

    mode: process.env.NODE_ENV,

    define: {
        'process.env.VITE_VERSION': JSON.stringify(packageJson.version) || '0.0.0',
    },

    build: {
        manifest: true,
        minify: isProduction,
        sourcemap: !isProduction,
        chunkSizeWarningLimit: 2048,
        rollupOptions: {
            output: {
                // * Splitting the chunks for better performance and caching
                manualChunks: {
                    // Vue
                    vue: ['vue', 'vue-router', 'vuex', 'vue3-click-away', 'vue-debounce', '@vueuse/rxjs', '@vueuse/core'],

                    // Sentry
                    sentry: ['@sentry/vue', '@sentry/tracing'],

                    // Mixpanel
                    mixpanel: ['mixpanel-browser'],

                    // Axios
                    axios: ['axios', 'axios-extensions'],

                    // Utilities
                    utils: ['bignumber.js', 'lodash', 'moment', 'socket.io-client'],

                    // Ant Design
                    'ant-design': ['ant-design-vue'],
                    'ant-design-icons': ['@ant-design/icons-vue'],

                    // Cosmology
                    '@cosmology': ['@cosmology/lcd'],
                    '@cosmology-cosmos-kit': ['@cosmos-kit/core'],

                    // Cosmology Wallets
                    '@cosmology-wallets-keplr': ['@cosmos-kit/keplr', '@cosmos-kit/keplr-extension', '@cosmos-kit/keplr-mobile'],
                    '@cosmology-wallets-leap': ['@cosmos-kit/leap', '@cosmos-kit/leap-extension', '@cosmos-kit/leap-mobile'],

                    // Cosmos SDK Stargate
                    '@cosmjs-stargate': ['@cosmjs/cosmwasm-stargate', '@cosmjs/stargate'],

                    // Cosmology Telescope
                    '@cosmology-telescope-ibc': ['osmojs/dist/codegen/ibc/bundle', 'osmojs/dist/codegen/ibc/client'],
                    '@cosmology-telescope-cosmos': ['osmojs/dist/codegen/cosmos/bundle', 'osmojs/dist/codegen/cosmos/client'],
                    '@cosmology-telescope-osmosis': ['osmojs/dist/codegen/osmosis/bundle', 'osmojs/dist/codegen/osmosis/client'],

                    // Blocknative web3 onboard
                    '@web3-onboard-cores': ['@web3-onboard/core', '@web3-onboard/vue', '@web3-onboard/common'],
                    '@web3-onboard-wallets': ['@web3-onboard/injected-wallets', '@web3-onboard/coinbase', '@web3-onboard/ledger'],

                    // TODO: Remove this after moving to the API chain registry
                    // Chain Registry
                    'chain-registry-mainnet': ['chain-registry/main/mainnet'],
                    'chain-registry-devnet': ['chain-registry/main/devnet'],
                    'chain-registry-testnet': ['chain-registry/main/testnet'],
                    '@chain-registry-helpers': ['@chain-registry/assets', '@chain-registry/utils'],
                },
            },
        },
    },

    server: {
        host: '0.0.0.0',
        historyApiFallback: true,
        https: isProduction,
        compress: true,
    },

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            'axios/lib': resolve(__dirname, './node_modules/axios/lib'),

            // TODO: Remove this after moving to the API chain registry
            'chain-registry-chains': 'chain-registry/main/mainnet/chains',
            'chain-registry-assets': 'chain-registry/main/mainnet/assets',
            'chain-registry-ibc': 'chain-registry/main/mainnet/ibc',
        },
        extensions: ['.js', '.vue'],
    },

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

    plugins: [
        vue({
            isProduction: isProduction,
        }),
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
        nodePolyfills({
            include: ['buffer', 'crypto', 'path', 'stream', 'util'],
        }),
        VitePWA({
            mode: process.env.NODE_ENV,
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.js',
            injectManifest: {
                maximumFileSizeToCacheInBytes: 20000000,
            },
        }),
        isAnalyzeBundle && visualizer({ open: true, gzipSize: true, brotliSize: true, template: 'sunburst', filename: 'stats.html', sourcemap: true, bundle: true }),
    ],
});
