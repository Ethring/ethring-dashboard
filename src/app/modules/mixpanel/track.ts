import { Mixpanel } from 'mixpanel-browser';
import { captureException } from '@/app/modules/sentry';

export function callTrackEvent(mixpanel: Mixpanel, eventName: string, params: Record<string, any>) {
    if (!process.env.MIXPANEL_TOKEN) return;

    //*  All undefined values in params edit to custom string.
    //*  If call track() with {'a': '1', 'b': undefined} then to mixpanel send request with only {'a': '1'} property
    Object.keys(params).forEach((key) => {
        params[key] === undefined ? (params[key] = 'WARNING! UNTRACK VALUE!') : null; // TODO need sentry alert?
    });

    try {
        mixpanel.track(eventName, params);
    } catch (e) {
        captureException(e);
        console.error('callTrackEvent: ', e);
    }
}

export function identify(mixpanel: Mixpanel, trackId: string) {
    if (!process.env.MIXPANEL_TOKEN) return;

    try {
        mixpanel.identify(trackId);
    } catch (e) {
        captureException(e);
        console.error('identify: ', e);
    }
}

export function reset(mixpanel: Mixpanel) {
    if (!process.env.MIXPANEL_TOKEN) return;

    try {
        mixpanel.reset();
    } catch (e) {
        captureException(e);
        console.error('identify: ', e);
    }
}

// eslint-disable-next-line @typescript-eslint/ban-types
// const execMixpanelCallback = (mixpanel: Mixpanel, callback: Function, ...args: any[]) => {
//     if (!process.env.MIXPANEL_TOKEN) return;

//     try {
//         callback.apply(mixpanel, args);
//     } catch (error) {
//         console.error('Error in mixpanel callback:', error);
//     }
// };
