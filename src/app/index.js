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

import SimpleBridge from '@/components/dynamic/bridge/SimpleBridge.vue';
import SimpleSend from '@/components/dynamic/send/SimpleSend.vue';
import SimpleSwap from '@/components/dynamic/swaps/SimpleSwap.vue';
import SuperSwap from '@/components/dynamic/super-swap/SuperSwap.vue';
import StakeLayout from '@/layouts/StakeLayout.vue';
import MintNftLayout from '@/layouts/MintNftLayout.vue';

// Service worker
import '@/registerServiceWorker';

// Compositions
import useAdapter from '@/Adapter/compositions/useAdapter';
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
app.component('MintNftLayout', MintNftLayout);

export default app;
