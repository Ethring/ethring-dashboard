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
        name: 'Stake $ATOM with Citadel.one',
        logoURI: '/img/icons/shortcuts/stake-c1.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'stake',
        description: 'Transfer your tokens automatically & stake with Citadel.one validator to earn passive income!',
        wallpaper: 'https://i.imgur.com/TzfbhhA.png',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.CitadelOne),
        minUsdAmount: 1,
        isActive: true,
    },
    [AvailableShortcuts.PostHumanStake]: {
        id: AvailableShortcuts.PostHumanStake,
        name: 'Staking $ATOM, $OSMO, $STARS to POSTHUMAN StakeDrop',
        logoURI: '/img/icons/shortcuts/stake-c1.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        type: 'stake',
        description: 'Transfer your tokens automatically & stake with POSTHUMAN validator to earn passive income!',
        wallpaper: '/img/wallpapers/SC-post-human-stake.png',
        website: 'https://posthuman.digital/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        minUsdAmount: 1,
        isActive: true,
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
        author: getAuthorById(ShortcutAuthor.Defigeek),
        isActive: true,
        minUsdAmount: 200,
        isComingSoon: true,
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
        minUsdAmount: 0,
        isActive: true,
    },
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
        author: getAuthorById(ShortcutAuthor.WitcherCrypto),
        minUsdAmount: 0.5,
        isActive: true,
    },
    [AvailableShortcuts.MintCollectionWithTransfer]: {
        id: AvailableShortcuts.MintCollectionWithTransfer,
        name: 'Mint Zomet Club NFTs for early adopters',
        logoURI: '/img/icons/shortcuts/mint-collection.svg',
        wallpaper: 'https://i.imgur.com/GLaOOnq.png',
        keywords: ['NFT', 'MINT', 'STARS'],
        tags: ['NFT', 'MINT'],
        type: 'nft',
        description:
            'Zomet Club NFT is only available to you as early adopter of Zomet platform. ZC NFT holders are going to receive perks & benefits at a later stage!',
        website: 'https://www.stargaze.zone/',
        author: getAuthorById(ShortcutAuthor.ZometApp),
        ecosystems: ['EVM', 'COSMOS'],
        minUsdAmount: 0,
        isActive: false,
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
        author: getAuthorById(ShortcutAuthor.Neshtedle),
        minUsdAmount: 1,
        isComingSoon: true,
        isActive: true,
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
        author: getAuthorById(ShortcutAuthor.Pavlutsky),
        minUsdAmount: 1,
        isComingSoon: true,
        isActive: true,
    },
    [AvailableShortcuts.ConvertTia]: {
        id: 'convert-tia-to-sttia',
        name: 'Convert TIA to stTiA',
        logoURI: '/img/icons/shortcuts/convert-tia.svg',
        keywords: ['swap', 'bridge'],
        tags: ['COSMOS', 'SWAP'],
        ecosystems: ['COSMOS'],
        type: 'swap',
        description:
            'stTIA allows holders to earn Celestia staking yields passively while still maintaining a liquid position that can be used in other DeFi projects.',
        wallpaper: '/img/wallpapers/convert-tia.svg',
        website: 'https://citadel.one/',
        author: getAuthorById(ShortcutAuthor.Stride),
        minUsdAmount: 1,
        isComingSoon: true,
        isActive: true,
    },
    [AvailableShortcuts.PendleEarnFixedYield]: {
        id: AvailableShortcuts.PendleEarnFixedYield,
        name: 'Earn fixed yield on Pendle',
        logoURI: '/img/icons/shortcuts/rage-quite.svg',
        // logoURI: 'https://pendle.finance/images/pendle-logo.svg',
        // logoURI: 'https://www.pendle.finance/uploads/wp-content/uploads/2022/brandguide/logos/dark-svg/no-glow-cropped.svg',
        keywords: ['pendle', 'yield', 'fixed'],
        tags: ['PENDLE', 'YIELD'],
        ecosystems: ['EVM'],
        type: 'yield',
        description: 'Earn fixed yield on Pendle with your assets',
        wallpaper: '/img/wallpapers/SC-pendle-earn-fixed-yield.png',
        website: 'https://pendle.finance/',
        minUsdAmount: 1.8,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.PendleBeefy]: {
        id: AvailableShortcuts.PendleBeefy,
        name: 'Earn fixed yield on Beefy',
        logoURI: '/img/icons/shortcuts/rage-quite.svg',
        keywords: ['pendle', 'yield', 'beefy'],
        tags: ['PENDLE', 'BEEFY'],
        ecosystems: ['EVM'],
        type: 'yield',
        description: 'Optimize your strategies and increase your earnings with Beefy Finance',
        wallpaper: '/img/wallpapers/SC-pendle-beefy.png',
        website: 'https://pendle.finance/',
        minUsdAmount: 1.5,
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
