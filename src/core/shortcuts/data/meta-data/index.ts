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
        name: 'Stake $ATOM, $OSMO, $STARS with Citadel.one',
        logoURI: '/img/icons/shortcuts/stake-c1.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['EVM', 'COSMOS', 'STAKE'],
        ecosystems: ['EVM', 'COSMOS'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['bsc', 'cosmos', 'osmosis', 'stargaze'],
        },
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
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['bsc', 'cosmos', 'osmosis', 'stargaze'],
        },
        type: 'stake',
        description: 'Transfer your tokens automatically & stake with POSTHUMAN validator to earn passive income!',
        wallpaper: '/img/wallpapers/SC-post-human-stake.png',
        website: 'https://posthuman.digital/',
        author: getAuthorById(ShortcutAuthor.PostHuman),
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
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['eth', 'osmosis', 'cosmos', 'celestia'],
        },
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
        name: 'Staking $ATOM, $OSMO, $STARS to Citadel.one',
        logoURI: '/img/icons/shortcuts/stake-c1.svg',
        keywords: ['citadel', 'one', 'staking'],
        tags: ['COSMOS', 'STAKE'],
        ecosystems: ['COSMOS'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['cosmos', 'osmosis', 'stargaze'],
        },
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
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['cosmos', 'osmosis', 'stargaze'],
        },
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
        networksConfig: { fullEcosystems: [], additionalNetworks: ['stargaze'] },
        minUsdAmount: 0,
        isActive: false,
    },
    [AvailableShortcuts.SellEverything]: {
        id: AvailableShortcuts.SellEverything,
        name: 'Rage Quit - Sell everything in one click',
        logoURI: '/img/icons/shortcuts/rage-quite.svg',
        keywords: ['sell', 'swap', 'bridge'],
        tags: ['EVM', 'COSMOS', 'SELL'],
        ecosystems: ['EVM', 'COSMOS'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['eth', 'osmosis', 'cosmos', 'injective'],
        },
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
        id: AvailableShortcuts.WithdrawDydx,
        name: 'Withdraw dYdX USDC to USDT TRC20',
        logoURI: '/img/icons/shortcuts/dydx.svg',
        keywords: ['stake', 'swap', 'bridge'],
        tags: ['EVM', 'SWAP'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: ['evm'],
            additionalNetworks: ['osmosis', 'cosmos'],
        },
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
        id: AvailableShortcuts.ConvertTia,
        name: 'Convert TIA to stTiA',
        logoURI: '/img/icons/shortcuts/convert-tia.svg',
        keywords: ['swap', 'bridge'],
        tags: ['COSMOS', 'SWAP'],
        ecosystems: ['COSMOS'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['osmosis'],
        },
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
        name: 'Earn fixed yield on Silo',
        logoURI:
            'https://jumper.exchange/_next/image/?url=https%3A%2F%2Fstrapi.li.finance%2Fuploads%2FAvatar_Silo_Dark_Mode_False_6e6997fd7a.png&w=96&q=75',
        keywords: ['pendle', 'yield', 'fixed'],
        tags: ['PENDLE', 'YIELD'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['arbitrum'],
        },
        type: 'yield',
        description: 'Earn fixed yield on Pendle with your assets',
        wallpaper: '/img/wallpapers/SC-pendle-earn-fixed-yield.png',
        website: 'https://pendle.finance/',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.PendleBeefy]: {
        id: AvailableShortcuts.PendleBeefy,
        name: 'Earn fixed yield on Beefy',
        logoURI:
            'https://jumper.exchange/_next/image/?url=https%3A%2F%2Fstrapi.li.finance%2Fuploads%2FAvatar_Beefy_Dark_Mode_False_38f50c968b.png&w=96&q=75',
        keywords: ['pendle', 'yield', 'beefy'],
        tags: ['PENDLE', 'BEEFY'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['arbitrum'],
        },
        type: 'yield',
        description: 'Optimize your strategies and increase your earnings with Beefy Finance',
        wallpaper: '/img/wallpapers/SC-pendle-beefy.png',
        website: 'https://pendle.finance/',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.Debridge]: {
        id: AvailableShortcuts.Debridge,
        name: 'Earn points for every deBridge transaction',
        logoURI: 'https://app.debridge.finance/assets/images/bridge.svg',
        keywords: ['deBridge', 'points'],
        tags: ['deBridge', 'bridge'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['eth', 'arbitrum', 'avalanche', 'bsc', 'fantom', 'optimism', 'polygon', 'base', 'gnosis'],
        },
        type: 'bridge',
        description: 'Earn points for every transaction made through the deBridge service.',
        wallpaper: '/img/wallpapers/debridge.png',
        website: 'https://debridge.finance/',
        minUsdAmount: 2,
        author: getAuthorById(ShortcutAuthor.DeBridge),
        isActive: true,
    },
    [AvailableShortcuts.AddLiquidityPool1]: {
        id: AvailableShortcuts.AddLiquidityPool1,
        name: 'Add/remove for Balancer',
        logoURI:
            'https://jumper.exchange/_next/image/?url=https%3A%2F%2Fstrapi.li.finance%2Fuploads%2FAvatar_Balancer_Dark_Mode_False_d5317dbe76.png&w=96&q=75',
        keywords: ['liquidity', 'pool', 'Balancer'],
        tags: ['liquidity', 'pool', 'Balancer'],

        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['arbitrum'],
        },
        type: 'liquidity',
        description: 'Provide liquidity for the pool and earn money.',
        wallpaper: '',
        website: 'https://app.balancer.fi/#/ethereum',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.AddLiquidityPool2]: {
        id: AvailableShortcuts.AddLiquidityPool2,
        name: 'Add/remove for Sushi',
        logoURI: '/img/icons/shortcuts/rage-quite.svg',
        keywords: ['liquidity', 'pool', 'SushiSwap'],
        tags: ['liquidity', 'pool', 'SushiSwap'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['arbitrum'],
        },
        type: 'liquidity',
        description: 'Provide liquidity for the pool and earn money.',
        wallpaper: '',
        website: 'https://app.balancer.fi/#/ethereum',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.RemoveLiquidityPool]: {
        id: AvailableShortcuts.RemoveLiquidityPool,
        name: 'Remove liquidity from pool',
        logoURI: '/img/icons/shortcuts/rage-quite.svg',
        keywords: ['liquidity', 'pool'],
        tags: ['liquidity', 'pool'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['arbitrum', 'avalanche', 'bsc', 'fantom', 'optimism', 'polygon', 'base'],
        },
        type: 'liquidity',
        description: 'Remove liquidity from pool',
        wallpaper: '',
        website: 'https://app.balancer.fi/#/ethereum',
        minUsdAmount: 0,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.JumperSuperfest]: {
        id: AvailableShortcuts.JumperSuperfest,
        name: 'Explore superfests and earn rewards',
        logoURI: '/img/icons/shortcuts/jumper.png',
        keywords: ['superfest', 'defi'],
        tags: ['superfest', 'liquidity'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['optimism', 'base'],
        },
        type: 'liquidity',
        description: 'Explore superfests and earn rewards',
        wallpaper: '/img/wallpapers/jumper.png',
        website: 'https://jumper.exchange/superfest/',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.DripBeraTokens]: {
        id: AvailableShortcuts.DripBeraTokens,
        name: 'Faucet BERA testnet tokens',
        logoURI: 'https://artio-static-asset-public.s3.ap-southeast-1.amazonaws.com/assets/bera.png',
        keywords: ['berachain', 'testnet'],
        tags: ['BERA', 'TESTNET'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['berachain'],
        },
        type: 'claim',
        description: 'Fund your testnet wallet with BERA',
        wallpaper: '/img/wallpapers/bera-faucet.svg',
        website: 'https://jumper.exchange/superfest/',
        minUsdAmount: 0,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.BerachainVault]: {
        id: AvailableShortcuts.BerachainVault,
        name: 'Explore Bera testnet and earn points',
        logoURI: 'https://artio-static-asset-public.s3.ap-southeast-1.amazonaws.com/assets/bera.png',
        keywords: ['testnet', 'bera'],
        tags: ['VAULT', 'TESTNET'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['berachain'],
        },
        type: 'liquidity',
        description: 'Explore Bera testnet and earn points',
        wallpaper: '/img/wallpapers/berachain.png',
        website: 'https://bartio.bex.berachain.com',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.BerachainStake]: {
        id: AvailableShortcuts.BerachainStake,
        name: 'Berachain Staking to Citadel.One',
        logoURI: 'https://artio-static-asset-public.s3.ap-southeast-1.amazonaws.com/assets/bera.png',
        keywords: ['testnet', 'bera'],
        tags: ['DELEGATE', 'STAKE'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['berachain'],
        },
        type: 'liquidity',
        description: 'Delegate BGT to Citadel.One',
        wallpaper: '/img/wallpapers/berachain.jpg',
        website: 'https://bartio.bex.berachain.com',
        minUsdAmount: 0.1,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.ClaimBeraRewards]: {
        id: AvailableShortcuts.ClaimBeraRewards,
        name: 'Claim BGT rewards',
        logoURI: 'https://artio-static-asset-public.s3.ap-southeast-1.amazonaws.com/assets/bera.png',
        keywords: ['testnet', 'bera'],
        tags: ['CLAIM', 'REWARDS'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['berachain'],
        },
        type: 'claim',
        description: 'Claim BGT rewards',
        wallpaper: '/img/wallpapers/berachain.jpg',
        website: 'https://bartio.bex.berachain.com',
        minUsdAmount: 0,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.MorphoBlueVault]: {
        id: AvailableShortcuts.MorphoBlueVault,
        name: 'Add liquidity for Morpho vaults',
        logoURI: 'https://cdn.morpho.org/v2/assets/icons/butterfly-dark.svg',
        keywords: ['morpho', 'portal-fi'],
        tags: ['liquidity', 'rewards'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['base'],
        },
        type: 'liquidity',
        description: 'Add liquidity for Morpho vaults and earn',
        wallpaper: '/img/wallpapers/morpho.png',
        website: 'https://morpho.org/',
        minUsdAmount: 0,
        author: getAuthorById(ShortcutAuthor.ZometApp),
        isActive: true,
    },
    [AvailableShortcuts.MitosisVault]: {
        id: AvailableShortcuts.MitosisVault,
        name: 'Add liquidity for Mitosis vaults',
        logoURI: 'https://mitosis.org/assets/nav-logo.png',
        keywords: ['mitosis', 'vault'],
        tags: ['liquidity', 'rewards'],
        ecosystems: ['EVM'],
        networksConfig: {
            fullEcosystems: [],
            additionalNetworks: ['linea'],
        },
        type: 'liquidity',
        description: 'Deposit weETH to maximize MITO Point rewards',
        wallpaper: '/img/wallpapers/mitosis.png',
        website: 'https://mitosis.org/',
        minUsdAmount: 0,
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
            networksConfig: {
                fullEcosystems: [],
                additionalNetworks: [],
            },
        } as IShortcutMeta;

    return META_DATA[id];
};

export default META_DATA;
