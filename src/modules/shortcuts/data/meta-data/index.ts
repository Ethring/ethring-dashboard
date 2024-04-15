import { getAuthorById, IAuthor } from '@/modules/shortcuts/data/authors';
import { IShortcutData } from '@/modules/shortcuts/core/Shortcut';
import { AvailableShortcuts, ShortcutAuthor } from '../shortcuts';

interface IShortcutMeta extends IShortcutData {
    ecosystems: string[];
    author: IAuthor;
}

const META_DATA: Record<string, IShortcutMeta> = {
    [AvailableShortcuts.CitadelOneStake]: {
        id: AvailableShortcuts.CitadelOneStake,
        name: 'Recipe #1: Transfer & Stake to the Citadel.one validator',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'stake',
        description: 'Transfer your tokens from EVM or COSMOS ecosystem and stake them to the Citadel.one validator and earn rewards.',
        wallpaper: '',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
    },
    [AvailableShortcuts.MintCollection]: {
        id: AvailableShortcuts.MintCollection,
        name: 'Recipe #2: Mint collection',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        wallpaper: '',
        keywords: ['NFT', 'MINT', 'STARS'],
        tags: ['NFT', 'MINT'],
        type: 'nft',
        description: 'Mint collection of NFTs on Stargaze Zone',
        website: 'https://www.stargaze.zone/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        ecosystems: ['EVM', 'COSMOS'],
        minUsdAmount: 0,
    },
    [AvailableShortcuts.StakeToCitadelOne]: {
        id: AvailableShortcuts.StakeToCitadelOne,
        name: 'Recipe #3: Stake to the Citadel.one validator',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['COSMOS', 'STAKE'],
        ecosystems: ['COSMOS'],
        type: 'stake',
        description: 'Stake your COSMOS ecosystem tokens to the Citadel.one validator and earn rewards.',
        wallpaper: '',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 0,
    },
    [AvailableShortcuts.SwapToAtomAndStars]: {
        id: AvailableShortcuts.SwapToAtomAndStars,
        name: 'Recipe #4: Swap OSMO to ATOM and STARS',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['ATOM', 'STARS', 'SWAP'],
        tags: ['ATOM', 'STARS', 'SWAP'],
        ecosystems: ['COSMOS'],
        type: 'swap',
        description: 'Swap your OSMO tokens to ATOM and STARS',
        wallpaper: '',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
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
            minUsdAmount: 0,
            author: getAuthorById(ShortcutAuthor.ZometApp),
        } as IShortcutMeta;

    return META_DATA[id];
};

export default META_DATA;
