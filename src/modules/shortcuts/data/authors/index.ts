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
        avatar: 'https://zomet-logo.png',
        socials: [
            {
                type: 'x.com',
                nickname: 'zometapp',
                link: 'https://twitter.com/zometapp',
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
