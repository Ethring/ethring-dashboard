import { ShortcutAuthor } from '../shortcuts';

export interface IAuthor {
    id: string;
    name: string;
    avatar: string;
    socials: {
        type: string;
        nickname: string;
        link: string;
    }[];
}

const AUTHORS: Record<string, IAuthor> = {
    [ShortcutAuthor.ZometApp]: {
        id: 'zomet.app',
        name: 'zomet.app',
        avatar: 'https://pbs.twimg.com/profile_images/1644454694327054337/CAiG8xbc_400x400.jpg',
        socials: [
            {
                type: 'x.com',
                nickname: 'zometapp',
                link: 'https://twitter.com/zometapp',
            },
        ],
    },
    [ShortcutAuthor.CitadelOne]: {
        id: 'citadelOne',
        name: 'Citadel.one',
        avatar: 'https://pbs.twimg.com/profile_images/1613219880156729349/K0BK_Wcm_400x400.png',
        socials: [
            {
                type: 'x.com',
                nickname: 'Citadel.one',
                link: 'https://twitter.com/CitadelDAO',
            },
        ],
    },
    [ShortcutAuthor.Stride]: {
        id: 'stride',
        name: 'Stride',
        avatar: 'https://pbs.twimg.com/profile_images/1678377000468205568/UY9UaLF0_400x400.png',
        socials: [
            {
                type: 'x.com',
                nickname: 'stride_zone',
                link: 'https://twitter.com/stride_zone',
            },
        ],
    },
    [ShortcutAuthor.Neshtedle]: {
        id: 'neshtedle',
        name: 'Neshtedle',
        avatar: 'https://pbs.twimg.com/profile_images/1778258375098167296/6MxlYA3t_400x400.jpg',
        socials: [
            {
                type: 'x.com',
                nickname: 'neshtedle',
                link: 'https://twitter.com/neshtedle/',
            },
        ],
    },
    [ShortcutAuthor.Pavlutsky]: {
        id: 'pavlutsky',
        name: 'Anton Pavlutsky',
        avatar: 'https://pbs.twimg.com/profile_images/1537733430120685569/ucMYXA6g_400x400.jpg',
        socials: [
            {
                type: 'x.com',
                nickname: 'Pavlutsky',
                link: 'https://twitter.com/Pavlutsky/',
            },
        ],
    },
    [ShortcutAuthor.Defigeek]: {
        id: 'defigeek',
        name: 'Defigeek',
        avatar: 'https://pbs.twimg.com/profile_images/1517313514322419712/Ip9XnQjD_400x400.jpg',
        socials: [
            {
                type: 'x.com',
                nickname: 'deeznftees',
                link: 'https://twitter.com/deeznftees/',
            },
        ],
    },
    [ShortcutAuthor.WitcherCrypto]: {
        id: 'witcherCrypto',
        name: 'CryptoWitcher',
        avatar: 'https://pbs.twimg.com/profile_images/1389283656225677312/uFZCxvR1_400x400.jpg',
        socials: [
            {
                type: 'x.com',
                nickname: 'CryptoWitcherio',
                link: 'https://twitter.com/CryptoWitcherio',
            },
        ],
    },
};
export const getAuthorById = (id: string): IAuthor => {
    if (!AUTHORS[id])
        return {
            id: '',
            name: '',
            avatar: '',
            socials: [],
        };

    return AUTHORS[id];
};

export default AUTHORS;
