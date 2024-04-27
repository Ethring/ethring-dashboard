import { getAuthorById, IAuthor } from '@/core/shortcuts/data/authors';
import { IShortcutData } from '@/core/shortcuts/core/Shortcut';
import { AvailableShortcuts, ShortcutAuthor } from '../shortcuts';

interface IShortcutMeta extends IShortcutData {
    ecosystems: string[];
    author: IAuthor;
    isActive: boolean;
}

const META_DATA: Record<string, IShortcutMeta> = {
    [AvailableShortcuts.CitadelOneStake]: {
        id: AvailableShortcuts.CitadelOneStake,
        name: 'Transfer & Stake to the Citadel.one validator',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'stake',
        description: 'Transfer your tokens from EVM or COSMOS ecosystem and stake them to the Citadel.one validator and earn rewards.',
        wallpaper: 'https://i.imgur.com/TzfbhhA.png',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
        isActive: true,
    },
    [AvailableShortcuts.StakeToCitadelOne]: {
        id: AvailableShortcuts.StakeToCitadelOne,
        name: 'Stake to the Citadel.one validator',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['COSMOS', 'STAKE'],
        ecosystems: ['COSMOS'],
        type: 'stake',
        description: 'Stake your COSMOS ecosystem tokens to the Citadel.one validator and earn rewards.',
        wallpaper: 'https://i.imgur.com/TzfbhhA.png',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 0.5,
        isActive: true,
    },
    [AvailableShortcuts.SwapToAtomAndStars]: {
        id: AvailableShortcuts.SwapToAtomAndStars,
        name: 'Swap OSMO to ATOM and STARS',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['ATOM', 'STARS', 'SWAP'],
        tags: ['ATOM', 'STARS', 'SWAP'],
        ecosystems: ['COSMOS'],
        type: 'swap',
        description: 'Swap your OSMO tokens to ATOM and STARS',
        wallpaper: '',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 0.5,
        isActive: true,
    },
    [AvailableShortcuts.MintCollectionWithTransfer]: {
        id: AvailableShortcuts.MintCollectionWithTransfer,
        name: 'Mint collection with transfer',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        wallpaper: 'https://i.imgur.com/GLaOOnq.png',
        keywords: ['NFT', 'MINT', 'STARS'],
        tags: ['NFT', 'MINT'],
        type: 'nft',
        description: 'Mint collection of NFTs on Stargaze Zone with transfer',
        website: 'https://www.stargaze.zone/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        ecosystems: ['EVM', 'COSMOS'],
        minUsdAmount: 0,
        isActive: false,
    },
    [AvailableShortcuts.SellEverything]: {
        id: 'sell-everything-in-one-click',
        name: 'Recipe #6: Rage Quit - Sell everything in one click',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['sell', 'swap', 'bridge'],
        tags: ['EVM', 'COSMOS', 'SELL'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'swap',
        description: 'Sell all the assets you have on your chosen addresses.',
        wallpaper: '/img/wallpapers/rage-quite.svg',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
        isComingSoon: true,
        isActive: true,
    },
    [AvailableShortcuts.WithdrawDydx]: {
        id: 'withdraw-dYdX-usdc-rewards-to-usdt-on-tron',
        name: 'Recipe #7: Withdraw dYdX USDC rewards to USDT on Tron',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['stake', 'swap', 'bridge'],
        tags: ['EVM', 'SWAP'],
        ecosystems: ['EVM'],
        type: 'swap',
        description:
            'Transfer your earned dYdX USDC rewards seamlessly to USDT on Tron blockchain with ease and convenience. Maximize your flexibility and liquidity while managing your crypto assets efficiently.',
        wallpaper: '/img/wallpapers/dydx.svg',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
        isComingSoon: true,
        isActive: true,
    },
    [AvailableShortcuts.ConvertTia]: {
        id: 'convert-tia-to-sttia',
        name: 'Recipe #8: Convert TIA to stTiA',
        logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
        keywords: ['swap', 'bridge'],
        tags: ['COSMOS', 'SWAP'],
        ecosystems: ['COSMOS'],
        type: 'swap',
        description:
            "TIA represents an intriguing asset with its unique dynamics and potential for value appreciation. However, the transition from TIA to stTiA, or 'suspected TIA,' introduces complexities that require careful consideration by investors and stakeholders.",
        wallpaper: '/img/wallpapers/convert-tia.svg',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
        isComingSoon: true,
        isActive: true,
    },
    [AvailableShortcuts.PendleEarnFixedYield]: {
        id: AvailableShortcuts.PendleEarnFixedYield,
        name: 'Earn fixed yield on Pendle',
        logoURI: 'https://pendle.finance/images/pendle-logo.svg',
        keywords: ['pendle', 'yield', 'fixed'],
        tags: ['PENDLE', 'YIELD'],
        ecosystems: ['EVM'],
        type: 'yield',
        description: 'Earn fixed yield on Pendle with your assets',
        wallpaper: '/img/wallpapers/SC-pendle-earn-fixed-yield.png',
        website: 'https://pendle.finance/',
        minUsdAmount: 1.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
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
            isActive: false,
        } as IShortcutMeta;

    return META_DATA[id];
};

export default META_DATA;
