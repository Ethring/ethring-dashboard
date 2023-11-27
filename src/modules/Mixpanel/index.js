import VueMixpanel from 'vue-mixpanel';

export default function useMixpanel(app) {
    if (!process.env.VUE_APP_MIXPANEL_TOKEN) {
        return;
    }

    return app.use(VueMixpanel, {
        token: process.env.VUE_APP_MIXPANEL_TOKEN,
        config: {
            debug: true,
            track_pageview: true,
            persistence: 'localStorage',
        },
    });
}
