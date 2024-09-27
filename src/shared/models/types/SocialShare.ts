export interface IShareParams {
    network: string;
    url: string;
    title?: string;
    description?: string;
    quote?: string;
    hashtags?: string;
    account?: string;
    media?: string;
}

export interface ISocialShare {
    // Main methods
    getShareLink: (network: string, props: IShareParams) => string;
    getSocialAccount: (network: string) => string;

    // Utils
    getDefaultParams: (network: string) => IShareParams;
    validateSocialNetwork: (network: string) => boolean;
    normalizeParams: (props: IShareParams) => IShareParams;
    processLinkTemplate: (template: string, params: Required<IShareParams>) => string;
}
