import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { getTestVar, TEST_CONST } from '../envHelper';
import { BasePage, SendPage, SwapPage, SuperSwapPage, DashboardPage } from '../model/VueApp/base.pages';
import {
    addWalletToKeplr,
    addWalletToMm,
    authInDashboardByKeplr,
    authInDashboardByMm,
    authInDashboardByMmCoingeckoMock,
    authInDashboardByMmTokensListMock,
    authMm_BalanceSwapAndTokensListMock,
    getPathToKeplrExtension,
    getPathToMmExtension,
} from './fixtureHelper';
import { proxyUrl } from '../../playwright.config';

const ADDRESS_BY_TX = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
const SEED_PHRASE_BY_TX = getTestVar(TEST_CONST.SEED_BY_MOCK_TX);

const SEED_PHRASE_BY_TX_2 = getTestVar(TEST_CONST.SEED_BY_MOCK_TX_2);

const SEED_PHRASE_BY_PROTOCOL = getTestVar(TEST_CONST.SEED_BY_PROTOCOL_TEST);

const SEED_EMPTY_WALLET = getTestVar(TEST_CONST.EMPTY_SEED);

export const testMetaMask = base.extend<{
    context: BrowserContext;

    authPage: BasePage;
    authPageEmptyWallet: BasePage;

    dashboard: DashboardPage;
    dashboardProtocol: DashboardPage;
    dashboardEmptyWallet: DashboardPage;

    sendPage: SendPage;
    sendPageCoingeckoMock: SendPage;
    sendPageCoingeckoMockRejectTest: SendPage;

    swapPage: SwapPage;
    swapPageMockTokensList: SwapPage;
    swapPageMockBalancesAndTokensList: SwapPage;
    superSwapPage: SuperSwapPage;
}>({
    context: async ({}, use) => {
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
        const zometPage = await authInDashboardByMm(context, SEED_PHRASE_BY_TX);
        await use(zometPage);
    },
    dashboardEmptyWallet: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, SEED_EMPTY_WALLET);
        await use(zometPage);
    },
    dashboardProtocol: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, SEED_PHRASE_BY_PROTOCOL);
        await use(zometPage);
    },
    swapPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, SEED_PHRASE_BY_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage);
    },
    swapPageMockTokensList: async ({ context }, use) => {
        const zometPage = await authInDashboardByMmTokensListMock(context, SEED_PHRASE_BY_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage);
    },
    swapPageMockBalancesAndTokensList: async ({ context }, use) => {
        const zometPage = await authMm_BalanceSwapAndTokensListMock(context, SEED_PHRASE_BY_TX, ADDRESS_BY_TX);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage);
    },
    superSwapPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, SEED_PHRASE_BY_TX);
        const superSwapPage = await zometPage.goToModule('superSwap');
        await use(superSwapPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, SEED_PHRASE_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
    sendPageCoingeckoMock: async ({ context }, use) => {
        const zometPage = await authInDashboardByMmCoingeckoMock(context, SEED_PHRASE_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
    sendPageCoingeckoMockRejectTest: async ({ context }, use) => {
        const zometPage = await authInDashboardByMmCoingeckoMock(context, SEED_PHRASE_BY_TX_2);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
});

export const testMetaMaskMockTx = base.extend<{
    context: BrowserContext;
    sendPage: SendPage;
}>({
    context: async ({}, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            ignoreHTTPSErrors: true,
            args: [
                `--disable-extensions-except=${getPathToMmExtension()}`,
                `--load-extension=${getPathToMmExtension()}`,
                '--force-fieldtrials',

                '--ignore-certificate-errors',
                `--proxy-server=${proxyUrl}`,
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ],
        });

        await use(context);
        await context.close();
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, SEED_PHRASE_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
});

export const testKeplr = base.extend<{
    context: BrowserContext;

    authPage: BasePage;

    dashboard: DashboardPage;
    dashboardProtocol: DashboardPage;
    sendPage: SendPage;
}>({
    context: async ({}, use) => {
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
        await use(zometPage);
    },
    dashboard: async ({ context }, use) => {
        const zometPage = await authInDashboardByKeplr(context, SEED_PHRASE_BY_TX);
        await use(zometPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByKeplr(context, SEED_PHRASE_BY_TX);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
    dashboardProtocol: async ({ context }, use) => {
        const zometPage = await authInDashboardByKeplr(context, SEED_PHRASE_BY_PROTOCOL);
        await use(zometPage);
    },
});
