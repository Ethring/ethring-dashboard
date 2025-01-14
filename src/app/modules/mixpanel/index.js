import VueMixpanel from 'vue-mixpanel';

export default function useMixpanel(app) {
    return;
    // if (!process.env.MIXPANEL_TOKEN) return;

    // return app.use(VueMixpanel, {
    //     token: process.env.MIXPANEL_TOKEN,
    //     config: {
    //         debug: true,
    //         track_pageview: true,
    //         persistence: 'localStorage',
    //     },
    // });
}
