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
        name: 'Stake $ATOM with Citadel.one',
        logoURI: '/img/icons/shortcuts/stake-c1.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'stake',
        description: 'Transfer your tokens automatically & stake with Citadel.one validator to earn passive income!',
        wallpaper: 'https://i.imgur.com/TzfbhhA.png',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
    },
    [AvailableShortcuts.AirdropFarmingPortfolio]: {
        id: AvailableShortcuts.AirdropFarmingPortfolio,
        name: 'Airdrop-farming portfolio',
        logoURI: '/img/icons/shortcuts/airdrop-farming-portfolio.svg',
        keywords: ['airdrop'],
        tags: ['EVM', 'COSMOS', 'airdrop'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'airdrop',
        description: 'Tokens you need to hold in order to receive sweet airdrops.',
        wallpaper: '/img/wallpapers/airdrop-farming.svg',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 200,
        isComingSoon: true,
    },
    // [AvailableShortcuts.StakeToCitadelOne]: {
    //     id: AvailableShortcuts.StakeToCitadelOne,
    //     name: 'Stake to the Citadel.one validator',
    //     logoURI: 'https://citadel.one/static/media/logo.3e3e3e3e.svg',
    //     keywords: ['citadel', 'one', 'staking'],
    //     tags: ['COSMOS', 'STAKE'],
    //     ecosystems: ['COSMOS'],
    //     type: 'stake',
    //     description: 'Stake your COSMOS ecosystem tokens to the Citadel.one validator and earn rewards.',
    //     wallpaper: 'https://i.imgur.com/TzfbhhA.png',
    //     website: 'https://citadel.one/',
    //     author: getAuthorById(ShortcutAuthor.ZometApp),
    //     minUsdAmount: 0.5,
    // },
    [AvailableShortcuts.SwapToAtomAndStars]: {
        id: AvailableShortcuts.SwapToAtomAndStars,
        name: 'Swap OSMO to ATOM and STARS',
        logoURI: '/img/icons/shortcuts/swap-osmo.svg',
        keywords: ['ATOM', 'STARS', 'SWAP'],
        tags: ['ATOM', 'STARS', 'SWAP'],
        ecosystems: ['COSMOS'],
        type: 'swap',
        description: 'Swap your OSMO tokens to ATOM and STARS',
        wallpaper: '',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 0.5,
    },
    [AvailableShortcuts.MintCollectionWithTransfer]: {
        id: AvailableShortcuts.MintCollectionWithTransfer,
        name: 'Mint Zomet Club NFTs for early adopters',
        logoURI: '/img/icons/shortcuts/mint-collection.svg',
        wallpaper: 'https://i.imgur.com/GLaOOnq.png',
        keywords: ['NFT', 'MINT', 'STARS'],
        tags: ['NFT', 'MINT'],
        type: 'nft',
        description: 'Zomet Club NFT is only available to you as early adopter of Zomet platform. ZC NFT holders are going to receive perks & benefits at a later stage!',
        website: 'https://www.stargaze.zone/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        ecosystems: ['EVM', 'COSMOS'],
        minUsdAmount: 0,
    },
    [AvailableShortcuts.SellEverything]: {
        id: 'sell-everything-in-one-click',
        name: 'Rage Quit - Sell everything in one click',
        logoURI: '/img/icons/shortcuts/rage-quite.svg',
        keywords: ['sell', 'swap', 'bridge'],
        tags: ['EVM', 'COSMOS', 'SELL'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'swap',
        description: 'Sell all the assets you have on your chosen addresses.',
        wallpaper: '/img/wallpapers/rage-quite.svg',
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
        isComingSoon: true,
    },
    [AvailableShortcuts.WithdrawDydx]: {
        id: 'withdraw-dYdX-usdc-rewards-to-usdt-on-tron',
        name: 'Withdraw dYdX USDC to USDT TRC20',
        logoURI: '/img/icons/shortcuts/dydx.svg',
        keywords: ['stake', 'swap', 'bridge'],
        tags: ['EVM', 'SWAP'],
        ecosystems: ['EVM'],
        type: 'swap',
        description: 'Seamlessly withdraw your dYdX rewards in USDC with no need to deal with bridging yoursel',
        wallpaper: '/img/wallpapers/dydx.svg',
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
        isComingSoon: true,
    },
    [AvailableShortcuts.ConvertTia]: {
        id: 'convert-tia-to-sttia',
        name: 'Convert TIA to stTiA',
        logoURI: '/img/icons/shortcuts/convert-tia.svg',
        keywords: ['swap', 'bridge'],
        tags: ['COSMOS', 'SWAP'],
        ecosystems: ['COSMOS'],
        type: 'swap',
        description: "stTIA allows holders to earn Celestia staking yields passively while still maintaining a liquid position that can be used in other DeFi projects.",
        wallpaper: '/img/wallpapers/convert-tia.svg',
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
        isComingSoon: true,
    }
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
