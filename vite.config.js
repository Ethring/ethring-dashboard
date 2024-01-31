import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';
import svgLoader from 'vite-svg-loader';

import packageJson from './package.json';

const IS_PROD = process.env.NODE_ENV === 'production';

export default defineConfig({
    plugins: [
        vue(),
        svgLoader(),
        nodePolyfills(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.js',
            injectManifest: { maximumFileSizeToCacheInBytes: 20000000 },
        }),
    ],
    base: './',
    server: {
        host: '0.0.0.0',
        historyApiFallback: true,
        https: IS_PROD,
    },
    build: {
        chunkSizeWarningLimit: 20000000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
                },
            },
        },
    },
    define: {
        'process.env.VITE_APP_VERSION': JSON.stringify(packageJson.version) || '0.0.0',
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
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.vue'],
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
});
