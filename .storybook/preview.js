/** @type { import('@storybook/vue3').Preview } */

import { setup } from "@storybook/vue3";
import i18n from '@/app/providers/i18n';
import Antd from 'ant-design-vue';

import './storybook.css';
import '../src/assets/styles/index.scss';

setup((app) => {
    app.use(Antd).use(i18n);
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
