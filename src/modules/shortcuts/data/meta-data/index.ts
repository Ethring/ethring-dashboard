import { getAuthorById, IAuthor } from '@/modules/shortcuts/data/authors';
import { IShortcutData } from '@/modules/shortcuts/core/Shortcut';
import { AvailableShortcuts } from '../shortcuts';

interface IShortcutMeta extends IShortcutData {
    ecosystems: string[];
    author: IAuthor;
}

const META_DATA: Record<string, IShortcutMeta> = {
    [AvailableShortcuts.CitadelOneStake]: {
        id: 'citadel-one-stake',
        name: 'Recipe #1: Stake to the Citadel.one validator',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'stake',
        description: 'Stake your COSMOS ecosystem tokens to the Citadel.one validator and earn rewards.',
        wallpaper: '',
        website: 'https://citadel.one/',
        author: {
            id: 'zomet.app',
            name: 'zomet.app',
            avatar: 'https://zomet-logo.png',
            socials: [
                {
                    type: 'x.com',
                    nickname: 'zometapp',
                    link: 'https://twitter.com/zometapp',
                },
            ],
        },
        minUsdAmount: 1,
    },
    [AvailableShortcuts.MintCollection]: {
        id: 'mint-collection',
        name: 'Recipe #2: Mint collection',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        wallpaper: '',
        keywords: ['NFT', 'MINT', 'STARS'],
        tags: ['NFT', 'MINT'],
        type: 'nft',
        description: 'Mint collection of NFTs on Stargaze Zone',
        website: 'https://www.stargaze.zone/',
        author: {
            id: 'zomet.app',
            name: 'zomet.app',
            avatar: 'https://zomet-logo.png',
            socials: [
                {
                    type: 'x.com',
                    nickname: 'zometapp',
                    link: 'https://twitter.com/zometapp',
                },
            ],
        },
        ecosystems: ['EVM', 'COSMOS'],
        minUsdAmount: 0,
    },
};

export const getShortcutMetaById = (id: string): IShortcutMeta => {
    if (!META_DATA[id])
        return {
            id: '',
            name: '',
            logoURI: '',
            keywords: [],
            tags: [],
            type: '',
            description: '',
            website: '',
            wallpaper: '',
            ecosystems: [],
        } as IShortcutMeta;

    return META_DATA[id];
};

export default META_DATA;
