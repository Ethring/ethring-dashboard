import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { getTestVar, TEST_CONST } from '../envHelper';
import { BasePage, SendPage, SwapPage, SuperSwapPage, DashboardPage, ShortcutPage } from '../model/VueApp/base.pages';
import {
    addWalletToKeplr,
    addWalletToMm,
    authByKeplrErrorJunoBalanceMock,
    authByMm,
    authMmCoingeckoAndBalanceMock,
    authByMmTokensListMock,
    authMmBalanceBySwapAndTokensListMock,
    getPathToKeplrExtension,
    getPathToMmExtension,
    authByMmMockEmptyWallets,
    authByKeplr,
    authByMmMockErrorBalance,
    authByKeplerAndMmBalanceMock,
} from './fixtureHelper';
import {
    COSMOS_WALLET_BY_SHORTCUT,
    COSMOS_WALLETS_BY_EMPTY_WALLET,
    COSMOS_WALLETS_BY_PROTOCOL_SEED,
    COSMOS_WALLETS_BY_SEED_MOCK_TX,
    METAMASK_DEFAULT_URL_NODE,
} from '../data/constants';
import { mockBalanceData, marketCapNativeEvmTokens } from '../data/mockHelper';
import { mockTxReceipt } from 'tests/data/mockDataByTests/ShortcutTransferAndStakeMock';
import { MOCK_EVM_TX_HASH } from 'tests/data/mockDataByTests/ShortcutTransferAndStakeMock';
import { mockMetaMaskSignTransaction } from 'tests/model/MetaMask/MetaMask.pages';

const ADDRESS_BY_TX = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
const SEED_PHRASE_BY_TX = getTestVar(TEST_CONST.SEED_BY_MOCK_TX);

const ADDRESS_BY_TX_2 = getTestVar(TEST_CONST.ETH_ADDRESS_TX_2);
const SEED_PHRASE_BY_TX_2 = getTestVar(TEST_CONST.SEED_BY_MOCK_TX_2);

const ADDRESS_BY_TX_3 = getTestVar(TEST_CONST.ETH_ADDRESS_TX_3);
const SEED_PHRASE_BY_TX_3 = getTestVar(TEST_CONST.SEED_BY_MOCK_TX_3);

const ADDRESS_BY_PROTOCOL = getTestVar(TEST_CONST.ETH_ADDRESS_BY_PROTOCOL_TEST);
const SEED_PHRASE_BY_PROTOCOL = getTestVar(TEST_CONST.SEED_BY_PROTOCOL_TEST);

const SEED_EMPTY_WALLET = getTestVar(TEST_CONST.EMPTY_SEED);
const EMPTY_ETH_ADDRESS = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);

const SEED_SHORTCUT_TEST = getTestVar(TEST_CONST.SEED_SHORTCUT_TEST);
const ETH_ADDRESS_SHORTCUT = getTestVar(TEST_CONST.ETH_ADDRESS_SHORTCUT);

export const testMetaMask = base.extend<{
    context: BrowserContext;

    authPage: BasePage;
    authPageEmptyWallet: BasePage;

    dashboard: DashboardPage;
    dashboardProtocol: DashboardPage;
    dashboardEmptyWallet: DashboardPage;
    dashboardAllBalanceError: DashboardPage;

    sendPage: SendPage;
    sendPageCoingeckoMock: SendPage;
    sendPageCoingeckoMockRejectTest: SendPage;

    swapPage: SwapPage;
    swapPageMockTokensList: SwapPage;
    swapPageMockBalancesAndTokensList: SwapPage;
    superSwapPageBalanceMock: SuperSwapPage;
    unauthSuperSwapPage: SuperSwapPage;
}>({
    context: async ({ }, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            ignoreHTTPSErrors: true,
            args: [
                `--disable-extensions-except=${getPathToMmExtension()}`,
                `--load-extension=${getPathToMmExtension()}`,
                '--force-fieldtrials',

                '--ignore-certificate-errors',

                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
        });

        await use(context);
        await context.close();
    },

    authPage: async ({ context }, use) => {
        await addWalletToMm(context, SEED_PHRASE_BY_TX);
        const zometPage = new BasePage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage);
    },
    authPageEmptyWallet: async ({ context }, use) => {
        await addWalletToMm(context, SEED_EMPTY_WALLET);
        const zometPage = new BasePage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage);
    },
    dashboard: async ({ context }, use) => {
        const zometPage = await authByMm(context, SEED_PHRASE_BY_TX);
        await use(zometPage);
    },
    dashboardEmptyWallet: async ({ context }, use) => {
        const zometPage = await authByMmMockEmptyWallets(context, SEED_EMPTY_WALLET, EMPTY_ETH_ADDRESS);
        await use(zometPage);
    },
    dashboardAllBalanceError: async ({ context }, use) => {
        const zometPage = await authByMmMockErrorBalance(context, SEED_EMPTY_WALLET, EMPTY_ETH_ADDRESS);
        await use(zometPage);
    },
    dashboardProtocol: async ({ context }, use) => {
        const zometPage = await authMmCoingeckoAndBalanceMock(context, SEED_PHRASE_BY_PROTOCOL, ADDRESS_BY_PROTOCOL, mockBalanceData);
        await use(zometPage);
    },
    swapPage: async ({ context }, use) => {
        const zometPage = await authByMm(context, SEED_PHRASE_BY_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage as SwapPage);
    },
    swapPageMockTokensList: async ({ context }, use) => {
        const zometPage = await authByMmTokensListMock(context, SEED_PHRASE_BY_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage as SwapPage);
    },
    swapPageMockBalancesAndTokensList: async ({ context }, use) => {
        const zometPage = await authMmBalanceBySwapAndTokensListMock(context, SEED_PHRASE_BY_TX, ADDRESS_BY_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage as SwapPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authByMm(context, SEED_PHRASE_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage as SendPage);
    },
    sendPageCoingeckoMock: async ({ context }, use) => {
        const zometPage = await authMmCoingeckoAndBalanceMock(context, SEED_PHRASE_BY_TX, ADDRESS_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage as SendPage);
    },
    sendPageCoingeckoMockRejectTest: async ({ context }, use) => {
        const zometPage = await authMmCoingeckoAndBalanceMock(context, SEED_PHRASE_BY_TX_2, ADDRESS_BY_TX_2);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage as SendPage);
    },
    superSwapPageBalanceMock: async ({ context }, use) => {
        const zometPage = await authMmCoingeckoAndBalanceMock(context, SEED_PHRASE_BY_TX_3, ADDRESS_BY_TX_3);
        const superSwapPage = await zometPage.goToModule('superSwap');
        await use(superSwapPage as SuperSwapPage);
    },
    unauthSuperSwapPage: async ({ context }, use) => {
        await addWalletToMm(context, SEED_EMPTY_WALLET);
        const zometPage = new SuperSwapPage(await context.newPage());

        const COINGECKO_ROUTE = '**/marketcaps/coingecko?**';
        context.route(COINGECKO_ROUTE, (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify(marketCapNativeEvmTokens),
            });
        });

        await zometPage.goToPage();
        await use(zometPage);
    },
});

export const testMetaMaskMockTx = base.extend<{
    context: BrowserContext;
    sendPage: SendPage;
}>({
    context: async ({ }, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            ignoreHTTPSErrors: true,
            args: [
                `--disable-extensions-except=${getPathToMmExtension()}`,
                `--load-extension=${getPathToMmExtension()}`,
                '--force-fieldtrials',

                '--ignore-certificate-errors',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
        });

        await use(context);
        await context.close();
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authByMm(context, SEED_PHRASE_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage as SendPage);
    },
});

export const testKeplr = base.extend<{
    context: BrowserContext;

    authPage: BasePage;

    dashboard: DashboardPage;
    dashboardProtocol: DashboardPage;
    sendPage: SendPage;
    swapPage: SwapPage;
}>({
    context: async ({ }, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            ignoreHTTPSErrors: true,
            args: [
                `--disable-extensions-except=${getPathToKeplrExtension()}`,
                `--load-extension=${getPathToKeplrExtension()}`,
                '--force-fieldtrials',

                '--ignore-certificate-errors',

                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
        });

        await use(context);
        await context.close();
    },
    authPage: async ({ context }, use) => {
        await addWalletToKeplr(context, SEED_PHRASE_BY_TX);
        const zometPage = new BasePage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage as BasePage);
    },
    dashboard: async ({ context }, use) => {
        const zometPage = await authByKeplr(context, SEED_PHRASE_BY_TX, COSMOS_WALLETS_BY_SEED_MOCK_TX);
        await use(zometPage as DashboardPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authByKeplr(context, SEED_PHRASE_BY_TX, COSMOS_WALLETS_BY_SEED_MOCK_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage as SendPage);
    },
    dashboardProtocol: async ({ context }, use) => {
        const zometPage = await authByKeplrErrorJunoBalanceMock(context, SEED_PHRASE_BY_PROTOCOL, COSMOS_WALLETS_BY_PROTOCOL_SEED);
        await use(zometPage);
    },
    swapPage: async ({ context }, use) => {
        const zometPage = await authByKeplr(context, SEED_PHRASE_BY_TX, COSMOS_WALLETS_BY_SEED_MOCK_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage as SwapPage);
    },
});

export const testMetaMaskAndKeplr = base.extend<{
    context: BrowserContext;
    authPage: BasePage;
    shortcutPage: ShortcutPage;
}>({
    context: async ({ }, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            ignoreHTTPSErrors: true,
            args: [
                `--disable-extensions-except=${getPathToKeplrExtension()},${getPathToMmExtension()}`,
                `--load-extension=${getPathToKeplrExtension()},${getPathToMmExtension()}`,
                '--force-fieldtrials',

                '--ignore-certificate-errors',

                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
        });

        await use(context);
        await context.close();
    },
    authPage: async ({ browser, context, page }, use) => {
        const zometPage = await authByKeplerAndMmBalanceMock(
            context,
            EMPTY_ETH_ADDRESS,
            SEED_EMPTY_WALLET,
            COSMOS_WALLETS_BY_EMPTY_WALLET,
            SEED_EMPTY_WALLET,
        );

        await use(zometPage);
    },

    shortcutPage: async ({ browser, context, page }, use) => {
        const zometPage = await authByKeplerAndMmBalanceMock(
            context,
            ETH_ADDRESS_SHORTCUT,
            SEED_SHORTCUT_TEST,
            COSMOS_WALLET_BY_SHORTCUT,
            SEED_SHORTCUT_TEST,
        );

        const shortcutPage = await zometPage.goToModule('shortcut');
        await use(shortcutPage as ShortcutPage);
    },
});
