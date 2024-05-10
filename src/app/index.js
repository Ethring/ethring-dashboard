import { createApp } from 'vue';

// Main app
import App from './index.vue';

// Providers
import Store from '@/app/providers/store.provider.js';
import Router from '@/app/providers/routes.provider.js';
import Antd from '@/app/providers/ant-design.provider.js';
import I18n from '@/app/providers/i18n';

// Modules
import socket from '@/app/modules/socket';
import initSentry from '@/app/modules/sentry';
import initMixpanel from '@/app/modules/mixpanel';

import SimpleBridge from '@/pages/dynamic-modules/SimpleBridge.vue';
import SimpleSend from '@/pages/dynamic-modules/SimpleSend.vue';
import SimpleSwap from '@/pages/dynamic-modules/SimpleSwap.vue';
import SuperSwap from '@/pages/dynamic-modules/SuperSwap.vue';

import StakeLayout from '@/pages/dynamic-modules/StakeLayout.vue';
import MintNftLayoutWithTransfer from '@/pages/dynamic-modules/MintNftLayoutWithTransfer.vue';
import PendleSiloLayout from '@/pages/dynamic-modules/PendleSiloLayout.vue';

// Service worker
import '@/registerServiceWorker';

// Compositions
import useAdapter from '@/core/wallet-adapter/compositions/useAdapter';
import useSelectModal from '@/compositions/useSelectModal';

// Directives
import vueDebounce from 'vue-debounce';
import VueClickAway from 'vue3-click-away';

// Logger (custom)
import logger from '@/shared/logger';

import '@/app/scripts/window-custom.ts';

// SCSS styles
import '@/assets/styles/index.scss';

socket.init(Store);

// * Create app
const app = createApp(App);

// * Use providers
app.use(Antd).use(logger).use(Store).use(VueClickAway).use(Router).use(I18n);

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

// * Use compositions
app.provide('useAdapter', useAdapter).provide('useSelectModal', useSelectModal);

// * Init modules before app mount
initSentry(app, Router);
initMixpanel(app);

// * Component registration
app.component('SimpleSwap', SimpleSwap, { meta: { key: 'swap' } });
app.component('SimpleBridge', SimpleBridge, { meta: { key: 'bridge' } });
app.component('SimpleSend', SimpleSend, { meta: { key: 'send' } });
app.component('SuperSwap', SuperSwap, { meta: { key: 'superSwap' } });
app.component('StakeLayout', StakeLayout);

app.component('MintNftLayoutWithTransfer', MintNftLayoutWithTransfer);
app.component('PendleSiloLayout', PendleSiloLayout);

export default app;
