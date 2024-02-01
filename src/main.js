import { createApp } from 'vue';

// Directives
import vueDebounce from 'vue-debounce';
import VueClickAway from 'vue3-click-away';

// Antd styles
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

// Main app
import App from './App.vue';

// Router
import Router from './routes';

// Store
import store from './store';

// Styles
import '@/assets/styles/index.scss';

// i18n
import { i18n } from '@/shared/i18n';

// Modules for Sentry and Mixpanel
import useSentry from './modules/Sentry';
import useMixpanel from './modules/Mixpanel';

// Service worker
import './registerServiceWorker';
import useAdapter from './Adapter/compositions/useAdapter';

// * Init app
const app = createApp(App)
    .use(Antd)
    .directive(
        'debounce',
        vueDebounce({
            lock: true,
            listenTo: ['input', 'keyup'],
            defaultTime: '1s',
        })
    )
    .provide('useAdapter', useAdapter)
    .use(store)
    .use(VueClickAway)
    .use(Router)
    .use(i18n);

// * Init modules
useSentry(app, Router);
useMixpanel(app);

app.mount('#app');
