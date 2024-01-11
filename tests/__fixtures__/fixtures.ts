import { test as base, chromium, type BrowserContext } from '@playwright/test';

import { getTestVar, TEST_CONST } from '../envHelper';
import { EVM_NETWORKS } from '../data/constants';

import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import { getNotifyKeplrPage, KeplrNotifyPage } from '../model/Keplr/Keplr.pages';

import { BasePage, SendPage, SwapPage, SuperSwapPage, DashboardPage } from '../model/VueApp/base.pages';
import mockTokensListData from '../data/mockTokensListData';
import { addWalletToKeplr, addWalletToMm, getPathToKeplrExtension, getPathToMmExtension } from './fixtureHelper';

const seedPhraseByTx = getTestVar(TEST_CONST.SEED_BY_MOCK_TX);
const seedPhraseByProtocol = getTestVar(TEST_CONST.SEED_BY_PROTOCOL_TEST);
const seedPhraseEmptyWallet = getTestVar(TEST_CONST.EMPTY_SEED);

const authInDashboardByMm = async (context: BrowserContext, seed: String): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);

    const zometPage = new DashboardPage(await context.newPage());
    await zometPage.goToPage();

    await zometPage.clickLoginByMetaMask(context);
    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.assignPage();

    const providerModal = zometPage.page.getByText('Connection Successful');
    await providerModal.waitFor({ state: 'detached', timeout: 20000 });

    await zometPage.waitMainElementVisible();
    return zometPage;
};

const authInDashboardByMmTokensListMock = async (context: BrowserContext, seed: String): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);

    const zometPage = new DashboardPage(await context.newPage());
    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockTokensList(network, mockTokensListData[network])));
    await zometPage.goToPage();

    await zometPage.clickLoginByMetaMask();
    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.assignPage();

    const providerModal = zometPage.page.getByText('Connection Successful');
    await providerModal.waitFor({ state: 'detached', timeout: 20000 });

    await zometPage.waitMainElementVisible();
    return zometPage;
};

const authInDashboardByKeplr = async (context: BrowserContext, seed: String) => {
    await addWalletToKeplr(context, seed);

    const zometPage = new DashboardPage(await context.newPage());
    await zometPage.goToPage();

    await zometPage.clickLoginByKeplr();
    const notifyKeplr = new KeplrNotifyPage(await getNotifyKeplrPage(context));
    await notifyKeplr.assignPage();

    await zometPage.waitMainElementVisible();
    return zometPage;
};

export const testMetaMask = base.extend<{
    context: BrowserContext;

    authPage: BasePage;
    authPageEmptyWallet: BasePage;

    dashboard: DashboardPage;
    dashboardProtocol: DashboardPage;
    dashboardEmptyWallet: DashboardPage;

    sendPage: SendPage;
    swapPage: SwapPage;
    swapPageMockTokensList: SwapPage;
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
        await addWalletToMm(context, seedPhraseByTx);
        const zometPage = new BasePage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage);
    },
    authPageEmptyWallet: async ({ context }, use) => {
        await addWalletToMm(context, seedPhraseEmptyWallet);
        const zometPage = new BasePage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage);
    },
    dashboard: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByTx);
        await use(zometPage);
    },
    dashboardEmptyWallet: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseEmptyWallet);
        await use(zometPage);
    },
    dashboardProtocol: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByProtocol);
        await use(zometPage);
    },
    swapPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByTx);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage);
    },
    swapPageMockTokensList: async ({ context }, use) => {
        const zometPage = await authInDashboardByMmTokensListMock(context, seedPhraseByTx);
        const swapPage = await zometPage.goToModule('swap');
        await use(swapPage);
    },
    superSwapPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByTx);
        const superSwapPage = await zometPage.goToModule('superSwap');
        await use(superSwapPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByTx);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
});

export const testKeplr = base.extend<{
    context: BrowserContext;

    authPage: BasePage;

    dashboard: DashboardPage;
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
        await addWalletToKeplr(context, seedPhraseByTx);
        const zometPage = new BasePage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage);
    },
    dashboard: async ({ context }, use) => {
        const zometPage = await authInDashboardByKeplr(context, seedPhraseByTx);
        await use(zometPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByKeplr(context, seedPhraseByTx);
        const sendPage = await zometPage.goToModule('send');
        await use(sendPage);
    },
});
