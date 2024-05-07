/** @type { import('@storybook/vue3').Preview } */

import { setup } from "@storybook/vue3";

import Antd from 'ant-design-vue';

import i18n from '@/app/providers/i18n';
import Store from '@/app/providers/store.provider.js';

import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';

import './storybook.css';
import '../src/assets/styles/index.scss';

setup((app) => {
    app.use(Antd).use(i18n).use(Store);

    // * Use compositions
    app.provide('useAdapter', useAdapter);
});

const preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
};

export default preview;
