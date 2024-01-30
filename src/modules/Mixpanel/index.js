import VueMixpanel from 'vue-mixpanel';

export default function useMixpanel(app) {
    if (!import.meta.env.VITE_APP_MIXPANEL_TOKEN) {
        return;
    }

    return app.use(VueMixpanel, {
        token: import.meta.env.VITE_APP_MIXPANEL_TOKEN,
        config: {
            debug: true,
            track_pageview: true,
            persistence: 'localStorage',
        },
    });
}
