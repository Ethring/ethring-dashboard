import { linkTemplates, accounts } from '@/compositions/useSocialShare/data';
import { IShareParams, ISocialShare } from '@/shared/models/types/SocialShare';
import { ToRefs, toValue } from 'vue';

/**
 * @namespace useSocialShare
 *
 * @description Social share composition
 *
 * @summary Provides methods for generating social share links for different social networks
 *
 * @returns {ISocialShare}
 */
export function useSocialShare(): ISocialShare {
    // *****************************************************************************
    // * Utils
    // *****************************************************************************

    /**
     * @namespace useSocialShare
     *
     * @description Get default share params
     *
     * @function getDefaultParams
     *
     * @returns {Required<IShareParams>}
     */
    const getDefaultParams = (): Required<IShareParams> => {
        return {
            network: '',
            url: '',
            title: '',
            description: '',
            quote: '',
            hashtags: '',
            account: '',
            media: '',
        };
    };

    /**
     * @namespace useSocialShare
     *
     * @description Process link template
     *
     * @function processLinkTemplate
     *
     * @param {string} linkTemplate
     * @param {Required<IShareParams>} linkParts
     *
     * @returns {string}
     */
    const processLinkTemplate = (linkTemplate: string, linkParts: Required<IShareParams>) => {
        return linkTemplate
            .replace(/@tu/g, linkParts.account)
            .replace(/@u/g, linkParts.url)
            .replace(/@t/g, linkParts.title)
            .replace(/@d/g, linkParts.description)
            .replace(/@q/g, linkParts.quote)
            .replace(/@h/g, linkParts.hashtags)
            .replace(/@m/g, linkParts.media);
    };

    /**
     * @namespace useSocialShare
     *
     * @description Normalize share params
     *
     * @function normalizeParams
     *
     * @param {IShareParams | ToRefs<IShareParams>} shareParams
     *
     * @returns {Required<IShareParams>}
     */
    const normalizeParams = (shareParams: IShareParams | ToRefs<IShareParams>): Required<IShareParams> => {
        const defaultParams = getDefaultParams();
        return Object.fromEntries(
            (Object.keys(defaultParams) as Array<keyof IShareParams>).map((paramName) => {
                let paramValue = toValue(shareParams[paramName]) || defaultParams[paramName];
                paramValue = encodeURIComponent(paramValue);
                return [paramName, paramValue];
            }),
        ) as Required<IShareParams>;
    };

    /**
     * @namespace useSocialShare
     *
     * @description Validate social network
     *
     * @function validateSocialNetwork
     *
     * @param {string} network
     *
     * @returns {boolean}
     */
    const validateSocialNetwork = (network: string) => {
        if (!linkTemplates[network]) {
            console.error(`Social network "${network}" is not supported`);
            return false;
        }

        return true;
    };

    // ************************************************************************
    // * Methods
    // ************************************************************************

    /**
     * @namespace useSocialShare
     *
     * @description Get social account by network
     *
     * @function getSocialAccount
     *
     * @param {string} network
     *
     * @returns {string}
     */
    const getSocialAccount = (network: string) => {
        if (!validateSocialNetwork(network)) return '';
        return accounts[network] || '';
    };

    /**
     * @namespace useSocialShare
     *
     * @description Get share link
     *
     * @function getShareLink
     *
     * @param {string} network
     * @param {IShareParams} props
     *
     * @returns {string}
     */
    const getShareLink = (network: string, props: IShareParams) => {
        if (!validateSocialNetwork(network)) return '';

        let title = props.title || '';

        switch (network) {
            // Add hashtags, account and url to the title for warpcast
            case 'warpcast':
                if (props.hashtags && props.hashtags.length > 0) title += `\n#${props.hashtags.split(',').join('\n#')}`;
                title += `\n${props.url} via @${props.account}`;
                break;
            default:
                break;
        }

        const linkParts = normalizeParams({ ...props, title });

        return processLinkTemplate(linkTemplates[network], linkParts);
    };

    return {
        // Main methods
        getSocialAccount,
        getShareLink,

        // Utils
        getDefaultParams,
        validateSocialNetwork,
        normalizeParams,
        processLinkTemplate,
    };
}
