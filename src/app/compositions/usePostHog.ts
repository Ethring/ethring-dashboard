import posthog from 'posthog-js';

export const usePostHog = () => {
    posthog.init('phc_PtYWDl7hXegKntfUBK0Veu27pzmERK2rRJbW9EDqG4L', {
        api_host: 'https://eu.i.posthog.com',
    });

    return posthog;
};
