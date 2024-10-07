/** @type { import('@storybook/vue3-vite').StorybookConfig } */
import { resolve } from 'path';

const config = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
    framework: '@storybook/vue3-vite',
    docs: {
        autodocs: 'tag',
    },
    viteFinal: async (config) => {
        if (config.resolve)
            config.resolve.alias = {
                ...config.resolve?.alias,
                '#/core/wallet-adapter/compositions/useAdapter': resolve(__dirname, './mocks/adapter/'),
            };
        return config;
    },
};
export default config;
