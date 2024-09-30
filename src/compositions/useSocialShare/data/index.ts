/**
 * %0A = new line
 */
const NEW_LINE = '%0A';

// *****************************************************************************
// ******************* Social network share links for sharing ******************
// *****************************************************************************

/**
 * @namespace socialShare
 *
 * @enum SocialNetworks
 *
 * @description Social network keys
 *
 */
export enum SocialNetworks {
    x = 'x',
    hey = 'hey',
    warpcast = 'warpcast',
}

/**
 * @namespace socialShare
 *
 * @description Social network share links
 *
 * Properties:
 * @u url
 * @t title
 * @d description
 * @q quote
 * @h hashtags
 * @m media
 * @tu account
 */
export const linkTemplates = {
    /**
     * @name x.com
     * @supports: text, url, hashtags, via
     */
    [SocialNetworks.x]: `https://x.com/intent/post?text=@t${NEW_LINE}${NEW_LINE}&url=@u${NEW_LINE}&hashtags=@h${NEW_LINE}&via=@tu`,

    /**
     * @name hey.xyz
     * @supports: text, url, hashtags, via
     */
    [SocialNetworks.hey]: `https://hey.xyz/?text=@t${NEW_LINE}${NEW_LINE}&url=@u${NEW_LINE}&hashtags=@h&via=@tu`,

    /**
     * @name warpcast.com
     * @supports: text, url, via
     */
    [SocialNetworks.warpcast]: `https://warpcast.com/~/compose?text=@t${NEW_LINE}&embed[]=@u${NEW_LINE}@via=@tu`,
} as Record<string, string>;

// *****************************************************************************
// ******************* Accounts for social network sharing *********************
// *****************************************************************************

/**
 * @namespace socialShare
 *
 * @description Social network accounts for sharing
 *
 * @key network name
 * @value account name
 *
 * */
export const accounts = {
    [SocialNetworks.x]: 'zometapp',
    [SocialNetworks.hey]: 'zometapp', // TODO: Create account for hey.xyz
    [SocialNetworks.warpcast]: 'zometapp', // TODO: Create account for warpcast
} as Record<string, string>;
