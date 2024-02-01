import { resolve } from 'path';

import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import svgLoader from 'vite-svg-loader';

import packageJson from './package.json';

const IS_PROD = process.env.NODE_ENV === 'production';

export default defineConfig({
    plugins: [
        vue({
            isProduction: IS_PROD,
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
        nodePolyfills(),
        VitePWA({
            mode: IS_PROD ? 'production' : 'development',
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.js',
            injectManifest: {
                maximumFileSizeToCacheInBytes: 20000000,
            }
        }),
    ],
    base: '/',
    server: {
        host: '0.0.0.0',
        historyApiFallback: true,
        https: IS_PROD,
        compress: true,
    },
    build: {
        chunkSizeWarningLimit: 20000000,
        minify: IS_PROD,
    },
    define: {
        'process.env.VITE_VERSION': JSON.stringify(packageJson.version) || '0.0.0',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@cosmology/helpers': '@osmonauts/helpers',
            'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
            buffer: 'buffer/',
            util: 'util/',
            stream: 'stream-browserify/',
        },
        extensions: ['.js', '.json', '.vue'],
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
    optimizeDeps: {
        include: [
            'src/*'
        ],
    }
});
