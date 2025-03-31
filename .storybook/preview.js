/** @type { import('@storybook/vue3').Preview } */

import { setup } from '@storybook/vue3';

// Providers
import Router from '@/app/providers/routes.provider.js';
import Antd from '@/app/providers/ant-design.provider.js';
import I18n from '@/app/providers/i18n';

// Components
import AddLiquidityLayout from '@/pages/dynamic-modules/AddLiquidityLayout.vue';
import RemoveLiquidityLayout from '@/pages/dynamic-modules/RemoveLiquidityLayout.vue';

// Directives
import vueDebounce from 'vue-debounce';
import VueClickAway from 'vue3-click-away';

// Constants
import { createTestStore } from '../tests/unit/mocks/store';
import useAdapterMock from './mocks/adapter/';
import WebSocketMock from './mocks/socket/';

import './storybook.css';
import '../src/assets/styles/index.scss';

export const store = createTestStore();

export const mockSocketInstance = new WebSocketMock(store);

setup((app) => {
    app.use(Antd).use(store).use(VueClickAway).use(Router).use(I18n);

    // * Use compositions
    app.provide('useAdapter', useAdapterMock);
    app.provide('socket', mockSocketInstance);

    // * Use directives
    app.directive(
        'debounce',
        vueDebounce({
            lock: true,
            listenTo: ['input', 'keyup'],
            defaultTime: '1s',
            fireOnEmpty: true,
        }),
    );

    app.component('AddLiquidityLayout', AddLiquidityLayout);
    app.component('RemoveLiquidityLayout', RemoveLiquidityLayout);
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
