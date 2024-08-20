import { computed } from 'vue';
import { Store } from 'vuex';

import chainList from './chain-list.json';
import tokensWithBalance from './tokens-with-balance.json';
import tokensWithoutBalance from './tokens-without-balance.json';
import { Ecosystem, Ecosystems } from '../../../../src/shared/models/enums/ecosystems.enum';

export const chainListMockEvm = chainList.evm;
export const chainListMockCosmos = chainList.cosmos;

export const chainListMock = {
    [Ecosystem.EVM]: chainListMockEvm,
    [Ecosystem.COSMOS]: chainListMockCosmos,
};

export const tokensList = {
    withBalance: tokensWithBalance,
    withoutBalance: tokensWithoutBalance,
};

export const EVM_TEST_ADAPTER = () => ({
    walletAccount: computed(() => 'EVM Test Account'),
    currentChainInfo: computed(() => chainListMockEvm[0]),
    chainList: computed(() => chainListMockEvm),
});

export const EVM_TEST_SECOND_ADAPTER = () => ({
    walletAccount: computed(() => 'EVM Test 2 Account'),
    currentChainInfo: computed(() => chainListMockEvm[0]),
    chainList: computed(() => chainListMockEvm),
});

export const COSMOS_TEST_ADAPTER = () => ({
    walletAccount: computed(() => 'COSMOS Test Account'),
    currentChainInfo: computed(() => chainListMockCosmos[0]),
    chainList: computed(() => chainListMockCosmos),
});

export const MOCKED_ADAPTER = {
    [Ecosystem.EVM]: EVM_TEST_ADAPTER,
    [`${Ecosystem.EVM}-1`]: EVM_TEST_SECOND_ADAPTER,
    [Ecosystem.COSMOS]: COSMOS_TEST_ADAPTER,
};

export const ALL_CHAINS_LIST = [...chainListMockEvm, ...chainListMockCosmos];

export const CONNECTED_WALLETS = [
    {
        id: 'EVM-MetaMask',
        account: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
        address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
        addresses: {
            eth: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Ethereum.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Ethereum.png',
            },
            bsc: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/BNB.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/BNB.png',
            },
            arbitrum: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg?1680097630',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Ethereum.png',
            },
            polygon: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Polygon.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Polygon.png',
            },
            avalanche: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Avalanche.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Avalanche.png',
            },
            optimism: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Optimism.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Ethereum.png',
            },
            fantom: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Fantom.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Fantom.png',
            },
            zksync: {
                address: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24091.png',
                nativeTokenLogo: 'https://pulsar-images.s3.eu-west-1.amazonaws.com/tokens/Ethereum.png',
            },
        },
        chain: 42161,
        ecosystem: 'EVM',
        walletName: 'MetaMask',
        walletModule: 'MetaMask',
        icon: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjMzIiB2aWV3Qm94PSIwIDAgMzUgMzMiIHdpZHRoPSIzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iLjI1Ij48cGF0aCBkPSJtMzIuOTU4MiAxLTEzLjEzNDEgOS43MTgzIDIuNDQyNC01LjcyNzMxeiIgZmlsbD0iI2UxNzcyNiIgc3Ryb2tlPSIjZTE3NzI2Ii8+PGcgZmlsbD0iI2UyNzYyNSIgc3Ryb2tlPSIjZTI3NjI1Ij48cGF0aCBkPSJtMi42NjI5NiAxIDEzLjAxNzE0IDkuODA5LTIuMzI1NC01LjgxODAyeiIvPjxwYXRoIGQ9Im0yOC4yMjk1IDIzLjUzMzUtMy40OTQ3IDUuMzM4NiA3LjQ4MjkgMi4wNjAzIDIuMTQzNi03LjI4MjN6Ii8+PHBhdGggZD0ibTEuMjcyODEgMjMuNjUwMSAyLjEzMDU1IDcuMjgyMyA3LjQ2OTk0LTIuMDYwMy0zLjQ4MTY2LTUuMzM4NnoiLz48cGF0aCBkPSJtMTAuNDcwNiAxNC41MTQ5LTIuMDc4NiAzLjEzNTggNy40MDUuMzM2OS0uMjQ2OS03Ljk2OXoiLz48cGF0aCBkPSJtMjUuMTUwNSAxNC41MTQ5LTUuMTU3NS00LjU4NzA0LS4xNjg4IDguMDU5NzQgNy40MDQ5LS4zMzY5eiIvPjxwYXRoIGQ9Im0xMC44NzMzIDI4Ljg3MjEgNC40ODE5LTIuMTYzOS0zLjg1ODMtMy4wMDYyeiIvPjxwYXRoIGQ9Im0yMC4yNjU5IDI2LjcwODIgNC40Njg5IDIuMTYzOS0uNjEwNS01LjE3MDF6Ii8+PC9nPjxwYXRoIGQ9Im0yNC43MzQ4IDI4Ljg3MjEtNC40NjktMi4xNjM5LjM2MzggMi45MDI1LS4wMzkgMS4yMzF6IiBmaWxsPSIjZDViZmIyIiBzdHJva2U9IiNkNWJmYjIiLz48cGF0aCBkPSJtMTAuODczMiAyOC44NzIxIDQuMTU3MiAxLjk2OTYtLjAyNi0xLjIzMS4zNTA4LTIuOTAyNXoiIGZpbGw9IiNkNWJmYjIiIHN0cm9rZT0iI2Q1YmZiMiIvPjxwYXRoIGQ9Im0xNS4xMDg0IDIxLjc4NDItMy43MTU1LTEuMDg4NCAyLjYyNDMtMS4yMDUxeiIgZmlsbD0iIzIzMzQ0NyIgc3Ryb2tlPSIjMjMzNDQ3Ii8+PHBhdGggZD0ibTIwLjUxMjYgMjEuNzg0MiAxLjA5MTMtMi4yOTM1IDIuNjM3MiAxLjIwNTF6IiBmaWxsPSIjMjMzNDQ3IiBzdHJva2U9IiMyMzM0NDciLz48cGF0aCBkPSJtMTAuODczMyAyOC44NzIxLjY0OTUtNS4zMzg2LTQuMTMxMTcuMTE2N3oiIGZpbGw9IiNjYzYyMjgiIHN0cm9rZT0iI2NjNjIyOCIvPjxwYXRoIGQ9Im0yNC4wOTgyIDIzLjUzMzUuNjM2NiA1LjMzODYgMy40OTQ2LTUuMjIxOXoiIGZpbGw9IiNjYzYyMjgiIHN0cm9rZT0iI2NjNjIyOCIvPjxwYXRoIGQ9Im0yNy4yMjkxIDE3LjY1MDctNy40MDUuMzM2OS42ODg1IDMuNzk2NiAxLjA5MTMtMi4yOTM1IDIuNjM3MiAxLjIwNTF6IiBmaWxsPSIjY2M2MjI4IiBzdHJva2U9IiNjYzYyMjgiLz48cGF0aCBkPSJtMTEuMzkyOSAyMC42OTU4IDIuNjI0Mi0xLjIwNTEgMS4wOTEzIDIuMjkzNS42ODg1LTMuNzk2Ni03LjQwNDk1LS4zMzY5eiIgZmlsbD0iI2NjNjIyOCIgc3Ryb2tlPSIjY2M2MjI4Ii8+PHBhdGggZD0ibTguMzkyIDE3LjY1MDcgMy4xMDQ5IDYuMDUxMy0uMTAzOS0zLjAwNjJ6IiBmaWxsPSIjZTI3NTI1IiBzdHJva2U9IiNlMjc1MjUiLz48cGF0aCBkPSJtMjQuMjQxMiAyMC42OTU4LS4xMTY5IDMuMDA2MiAzLjEwNDktNi4wNTEzeiIgZmlsbD0iI2UyNzUyNSIgc3Ryb2tlPSIjZTI3NTI1Ii8+PHBhdGggZD0ibTE1Ljc5NyAxNy45ODc2LS42ODg2IDMuNzk2Ny44NzA0IDQuNDgzMy4xOTQ5LTUuOTA4N3oiIGZpbGw9IiNlMjc1MjUiIHN0cm9rZT0iI2UyNzUyNSIvPjxwYXRoIGQ9Im0xOS44MjQyIDE3Ljk4NzYtLjM2MzggMi4zNTg0LjE4MTkgNS45MjE2Ljg3MDQtNC40ODMzeiIgZmlsbD0iI2UyNzUyNSIgc3Ryb2tlPSIjZTI3NTI1Ii8+PHBhdGggZD0ibTIwLjUxMjcgMjEuNzg0Mi0uODcwNCA0LjQ4MzQuNjIzNi40NDA2IDMuODU4NC0zLjAwNjIuMTE2OS0zLjAwNjJ6IiBmaWxsPSIjZjU4NDFmIiBzdHJva2U9IiNmNTg0MWYiLz48cGF0aCBkPSJtMTEuMzkyOSAyMC42OTU4LjEwNCAzLjAwNjIgMy44NTgzIDMuMDA2Mi42MjM2LS40NDA2LS44NzA0LTQuNDgzNHoiIGZpbGw9IiNmNTg0MWYiIHN0cm9rZT0iI2Y1ODQxZiIvPjxwYXRoIGQ9Im0yMC41OTA2IDMwLjg0MTcuMDM5LTEuMjMxLS4zMzc4LS4yODUxaC00Ljk2MjZsLS4zMjQ4LjI4NTEuMDI2IDEuMjMxLTQuMTU3Mi0xLjk2OTYgMS40NTUxIDEuMTkyMSAyLjk0ODkgMi4wMzQ0aDUuMDUzNmwyLjk2Mi0yLjAzNDQgMS40NDItMS4xOTIxeiIgZmlsbD0iI2MwYWM5ZCIgc3Ryb2tlPSIjYzBhYzlkIi8+PHBhdGggZD0ibTIwLjI2NTkgMjYuNzA4Mi0uNjIzNi0uNDQwNmgtMy42NjM1bC0uNjIzNi40NDA2LS4zNTA4IDIuOTAyNS4zMjQ4LS4yODUxaDQuOTYyNmwuMzM3OC4yODUxeiIgZmlsbD0iIzE2MTYxNiIgc3Ryb2tlPSIjMTYxNjE2Ii8+PHBhdGggZD0ibTMzLjUxNjggMTEuMzUzMiAxLjEwNDMtNS4zNjQ0Ny0xLjY2MjktNC45ODg3My0xMi42OTIzIDkuMzk0NCA0Ljg4NDYgNC4xMjA1IDYuODk4MyAyLjAwODUgMS41Mi0xLjc3NTItLjY2MjYtLjQ3OTUgMS4wNTIzLS45NTg4LS44MDU0LS42MjIgMS4wNTIzLS44MDM0eiIgZmlsbD0iIzc2M2UxYSIgc3Ryb2tlPSIjNzYzZTFhIi8+PHBhdGggZD0ibTEgNS45ODg3MyAxLjExNzI0IDUuMzY0NDctLjcxNDUxLjUzMTMgMS4wNjUyNy44MDM0LS44MDU0NS42MjIgMS4wNTIyOC45NTg4LS42NjI1NS40Nzk1IDEuNTE5OTcgMS43NzUyIDYuODk4MzUtMi4wMDg1IDQuODg0Ni00LjEyMDUtMTIuNjkyMzMtOS4zOTQ0eiIgZmlsbD0iIzc2M2UxYSIgc3Ryb2tlPSIjNzYzZTFhIi8+PHBhdGggZD0ibTMyLjA0ODkgMTYuNTIzNC02Ljg5ODMtMi4wMDg1IDIuMDc4NiAzLjEzNTgtMy4xMDQ5IDYuMDUxMyA0LjEwNTItLjA1MTloNi4xMzE4eiIgZmlsbD0iI2Y1ODQxZiIgc3Ryb2tlPSIjZjU4NDFmIi8+PHBhdGggZD0ibTEwLjQ3MDUgMTQuNTE0OS02Ljg5ODI4IDIuMDA4NS0yLjI5OTQ0IDcuMTI2N2g2LjExODgzbDQuMTA1MTkuMDUxOS0zLjEwNDg3LTYuMDUxM3oiIGZpbGw9IiNmNTg0MWYiIHN0cm9rZT0iI2Y1ODQxZiIvPjxwYXRoIGQ9Im0xOS44MjQxIDE3Ljk4NzYuNDQxNy03LjU5MzIgMi4wMDA3LTUuNDAzNGgtOC45MTE5bDIuMDAwNiA1LjQwMzQuNDQxNyA3LjU5MzIuMTY4OSAyLjM4NDIuMDEzIDUuODk1OGgzLjY2MzVsLjAxMy01Ljg5NTh6IiBmaWxsPSIjZjU4NDFmIiBzdHJva2U9IiNmNTg0MWYiLz48L2c+PC9zdmc+',
    },
    {
        id: 'COSMOS-Keplr',
        account: 'Super-swap',
        address: 'cosmos1sa7spj5qyeagr87y069j2qcmxdswhh72kwwchf',
        addresses: {
            akash: {
                address: 'akash1sa7spj5qyeagr87y069j2qcmxdswhh72m4rlwn',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/akash/images/akt.png',
            },
            assetmantle: {
                address: 'mantle1sa7spj5qyeagr87y069j2qcmxdswhh72g24agr',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/assetmantle/images/AM_Logo.png',
            },
            axelar: {
                address: 'axelar1sa7spj5qyeagr87y069j2qcmxdswhh72jqcsug',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/axelar-chain-logo.png',
            },
            bitcanna: {
                address: 'bcna1sa7spj5qyeagr87y069j2qcmxdswhh72v77elm',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/bitcanna/images/bcna.png',
            },
            comdex: {
                address: 'comdex1sa7spj5qyeagr87y069j2qcmxdswhh723pv6w7',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/comdex/images/cmdx.png',
            },
            cosmoshub: {
                address: 'cosmos1sa7spj5qyeagr87y069j2qcmxdswhh72kwwchf',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.png',
            },
            crescent: {
                address: 'cre1sa7spj5qyeagr87y069j2qcmxdswhh72jxaazy',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/crescent/images/cre.png',
            },
            cudos: {
                address: 'cudos1sa7spj5qyeagr87y069j2qcmxdswhh72hl88fu',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cudos/images/cudos.png',
            },
            dydx: {
                address: 'dydx1sa7spj5qyeagr87y069j2qcmxdswhh72lhquh7',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/dydx/images/dydx.png',
            },
            emoney: {
                address: 'emoney1sa7spj5qyeagr87y069j2qcmxdswhh72ed5vq5',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/emoney/images/ngm.png',
            },
            fetchhub: {
                address: 'fetch1sa7spj5qyeagr87y069j2qcmxdswhh729n8u47',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/fetchhub/images/fet.png',
            },
            gravitybridge: {
                address: 'gravity1sa7spj5qyeagr87y069j2qcmxdswhh72j7uqjp',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/gravitybridge/images/grav.png',
            },
            impacthub: {
                address: 'ixo1sa7spj5qyeagr87y069j2qcmxdswhh72fms2n6',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/impacthub/images/ixo.png',
            },
            irisnet: {
                address: 'iaa1sa7spj5qyeagr87y069j2qcmxdswhh72rvwf4c',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/irisnet/images/iris.png',
            },
            juno: {
                address: 'juno1sa7spj5qyeagr87y069j2qcmxdswhh72qudrs4',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/juno/images/juno.png',
            },
            kichain: {
                address: 'ki1sa7spj5qyeagr87y069j2qcmxdswhh728rlhna',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/kichain/images/xki.png',
            },
            kyve: {
                address: 'kyve1sa7spj5qyeagr87y069j2qcmxdswhh72pqrwud',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/kyve/images/kyve.png',
            },
            likecoin: {
                address: 'like1sa7spj5qyeagr87y069j2qcmxdswhh729jj65j',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/likecoin/images/likecoin-chain-logo.png',
            },
            mars: {
                address: 'mars1sa7spj5qyeagr87y069j2qcmxdswhh72tnhpzj',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/mars/images/mars-token.png',
            },
            neutron: {
                address: 'neutron1sa7spj5qyeagr87y069j2qcmxdswhh72j386dw',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/neutron/images/neutron-black-logo.png',
            },
            noble: {
                address: 'noble1sa7spj5qyeagr87y069j2qcmxdswhh727dms08',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/stake.png',
            },
            nyx: {
                address: 'n1sa7spj5qyeagr87y069j2qcmxdswhh72y2e6gv',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/nyx/images/nym_token_light.png',
            },
            omniflixhub: {
                address: 'omniflix1sa7spj5qyeagr87y069j2qcmxdswhh72tslpqh',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/omniflixhub/images/flix.png',
            },
            onomy: {
                address: 'onomy1sa7spj5qyeagr87y069j2qcmxdswhh72v06wxv',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/onomy/images/nom.png',
            },
            osmosis: {
                address: 'osmo1sa7spj5qyeagr87y069j2qcmxdswhh7274agpm',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
            },
            passage: {
                address: 'pasg1sa7spj5qyeagr87y069j2qcmxdswhh724khz6k',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/passage/images/pasg.png',
            },
            persistence: {
                address: 'persistence1sa7spj5qyeagr87y069j2qcmxdswhh72czgted',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/persistence/images/xprt.png',
            },
            quasar: {
                address: 'quasar1sa7spj5qyeagr87y069j2qcmxdswhh72cd596v',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/quasar/images/quasar.png',
            },
            quicksilver: {
                address: 'quick1sa7spj5qyeagr87y069j2qcmxdswhh72a272wm',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/quicksilver/images/qck.png',
            },
            regen: {
                address: 'regen1sa7spj5qyeagr87y069j2qcmxdswhh72fv9ypd',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/regen/images/regen.png',
            },
            rizon: {
                address: 'rizon1sa7spj5qyeagr87y069j2qcmxdswhh724njfm3',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/rizon/images/atolo.png',
            },
            saga: {
                address: 'saga1sa7spj5qyeagr87y069j2qcmxdswhh72gah2s0',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/saga/images/saga.png',
            },
            sei: {
                address: 'sei1sa7spj5qyeagr87y069j2qcmxdswhh72mzlw3g',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/sei/images/sei.png',
            },
            sentinel: {
                address: 'sent1sa7spj5qyeagr87y069j2qcmxdswhh72d4cpnx',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/sentinel/images/dvpn.png',
            },
            shentu: {
                address: 'shentu1sa7spj5qyeagr87y069j2qcmxdswhh72762p95',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/shentu/images/ctk.png',
            },
            sommelier: {
                address: 'somm1sa7spj5qyeagr87y069j2qcmxdswhh726jp5xr',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/sommelier/images/somm.png',
            },
            stafihub: {
                address: 'stafi1sa7spj5qyeagr87y069j2qcmxdswhh72d97jr3',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/stafihub/images/stafihub-chain-logo.png',
            },
            stargaze: {
                address: 'stars1sa7spj5qyeagr87y069j2qcmxdswhh72zje9uc',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/stargaze/images/stars.png',
            },
            stride: {
                address: 'stride1sa7spj5qyeagr87y069j2qcmxdswhh7249wyr9',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/stride/images/stride-chain-logo.png',
            },
            teritori: {
                address: 'tori1sa7spj5qyeagr87y069j2qcmxdswhh7256e3ve',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/teritori/images/chain.png',
            },
            umee: {
                address: 'umee1sa7spj5qyeagr87y069j2qcmxdswhh72ycn8nm',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/umee/images/umee.png',
            },
            injective: {
                address: 'inj15sccpqcda8efupv6yhwaw00hewshkps36dj6mm',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/injective/images/inj.png',
            },
            terra2: {
                address: 'terra1u62x7r58gfcx7jhppvcn8y423qp3n2vsp73lya',
                logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/luna.png',
            },
        },
        chain: 'cosmoshub',
        ecosystem: 'COSMOS',
        walletName: 'Keplr',
        walletModule: 'keplr-extension',
    },
];

export const MOCKED_ADDRESSES_BY_CHAIN = {
    eth: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    bsc: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    arbitrum: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    polygon: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    avalanche: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    optimism: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    fantom: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    zksync: '0x43e6d84401b2cce782cae4745bbc78f0c17e8ae9',
    akash: 'akash1sa7spj5qyeagr87y069j2qcmxdswhh72m4rlwn',
    assetmantle: 'mantle1sa7spj5qyeagr87y069j2qcmxdswhh72g24agr',
    axelar: 'axelar1sa7spj5qyeagr87y069j2qcmxdswhh72jqcsug',
    bitcanna: 'bcna1sa7spj5qyeagr87y069j2qcmxdswhh72v77elm',
    comdex: 'comdex1sa7spj5qyeagr87y069j2qcmxdswhh723pv6w7',
    cosmoshub: 'cosmos1sa7spj5qyeagr87y069j2qcmxdswhh72kwwchf',
    crescent: 'cre1sa7spj5qyeagr87y069j2qcmxdswhh72jxaazy',
    cudos: 'cudos1sa7spj5qyeagr87y069j2qcmxdswhh72hl88fu',
    dydx: 'dydx1sa7spj5qyeagr87y069j2qcmxdswhh72lhquh7',
    emoney: 'emoney1sa7spj5qyeagr87y069j2qcmxdswhh72ed5vq5',
    fetchhub: 'fetch1sa7spj5qyeagr87y069j2qcmxdswhh729n8u47',
    gravitybridge: 'gravity1sa7spj5qyeagr87y069j2qcmxdswhh72j7uqjp',
    impacthub: 'ixo1sa7spj5qyeagr87y069j2qcmxdswhh72fms2n6',
    irisnet: 'iaa1sa7spj5qyeagr87y069j2qcmxdswhh72rvwf4c',
    juno: 'juno1sa7spj5qyeagr87y069j2qcmxdswhh72qudrs4',
    kichain: 'ki1sa7spj5qyeagr87y069j2qcmxdswhh728rlhna',
    kyve: 'kyve1sa7spj5qyeagr87y069j2qcmxdswhh72pqrwud',
    likecoin: 'like1sa7spj5qyeagr87y069j2qcmxdswhh729jj65j',
    mars: 'mars1sa7spj5qyeagr87y069j2qcmxdswhh72tnhpzj',
    neutron: 'neutron1sa7spj5qyeagr87y069j2qcmxdswhh72j386dw',
    noble: 'noble1sa7spj5qyeagr87y069j2qcmxdswhh727dms08',
    nyx: 'n1sa7spj5qyeagr87y069j2qcmxdswhh72y2e6gv',
    omniflixhub: 'omniflix1sa7spj5qyeagr87y069j2qcmxdswhh72tslpqh',
    onomy: 'onomy1sa7spj5qyeagr87y069j2qcmxdswhh72v06wxv',
    osmosis: 'osmo1sa7spj5qyeagr87y069j2qcmxdswhh7274agpm',
    passage: 'pasg1sa7spj5qyeagr87y069j2qcmxdswhh724khz6k',
    persistence: 'persistence1sa7spj5qyeagr87y069j2qcmxdswhh72czgted',
    quasar: 'quasar1sa7spj5qyeagr87y069j2qcmxdswhh72cd596v',
    quicksilver: 'quick1sa7spj5qyeagr87y069j2qcmxdswhh72a272wm',
    regen: 'regen1sa7spj5qyeagr87y069j2qcmxdswhh72fv9ypd',
    rizon: 'rizon1sa7spj5qyeagr87y069j2qcmxdswhh724njfm3',
    saga: 'saga1sa7spj5qyeagr87y069j2qcmxdswhh72gah2s0',
    sei: 'sei1sa7spj5qyeagr87y069j2qcmxdswhh72mzlw3g',
    sentinel: 'sent1sa7spj5qyeagr87y069j2qcmxdswhh72d4cpnx',
    shentu: 'shentu1sa7spj5qyeagr87y069j2qcmxdswhh72762p95',
    sommelier: 'somm1sa7spj5qyeagr87y069j2qcmxdswhh726jp5xr',
    stafihub: 'stafi1sa7spj5qyeagr87y069j2qcmxdswhh72d97jr3',
    stargaze: 'stars1sa7spj5qyeagr87y069j2qcmxdswhh72zje9uc',
    stride: 'stride1sa7spj5qyeagr87y069j2qcmxdswhh7249wyr9',
    teritori: 'tori1sa7spj5qyeagr87y069j2qcmxdswhh7256e3ve',
    umee: 'umee1sa7spj5qyeagr87y069j2qcmxdswhh72ycn8nm',
    injective: 'inj15sccpqcda8efupv6yhwaw00hewshkps36dj6mm',
    terra2: 'terra1u62x7r58gfcx7jhppvcn8y423qp3n2vsp73lya',
};
