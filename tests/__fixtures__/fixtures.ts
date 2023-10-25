import { test as base, chromium, type BrowserContext, Browser } from '@playwright/test';
import path from 'path';
import { MetaMaskHomePage, MetaMaskNotifyPage, getNotifyMmPage, closeEmptyPages } from '../model/metaMaskPages';
import { DashboardPage, SwapPage, SuperSwapPage, SendPage } from '../model/zometPages';
import { getTestVar, TEST_CONST } from '../envHelper';

export const metaMaskId = getTestVar(TEST_CONST.MM_ID);
const metamaskVersion = getTestVar(TEST_CONST.MM_VERSION);
const seedPhraseByTx = getTestVar(TEST_CONST.SEED_BY_MOCK_TX);
const seedPhraseByProtocol = getTestVar(TEST_CONST.SEED_BY_PROTOCOL_TEST);
const seedPhraseEmptyWallet = getTestVar(TEST_CONST.EMPTY_SEED);

const getPathToEx = () => path.join(__dirname, '..', `/data/metamask-chrome-${metamaskVersion}`);

const addWalletToMm = async (context: BrowserContext, seed: String) => {
    await closeEmptyPages(context);

    const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
    await metaMaskPage.addWallet(seed);
};

const authInDashboardByMm = async (context: BrowserContext, seed: String): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);

    const zometPage = new DashboardPage(await context.newPage());
    await zometPage.goToPage();

    await zometPage.clickLoginByMetaMask();
    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.assignPage();

    const providerModal = zometPage.page.getByText('Connection Successful');
    await providerModal.waitFor({ state: 'detached', timeout: 20000 }); 

    return zometPage;
};

export const test = base.extend<{
    context: BrowserContext;
    authPage: DashboardPage;
    authPageEmptyWallet: DashboardPage;

    dashboard: DashboardPage;
    dashboardProtocol: DashboardPage;
    dashboardEmptyWallet: DashboardPage;

    sendPage: SendPage;
    swapPage: SwapPage;
    superSwapPage: SuperSwapPage;
}>({
    context: async ({}, use) => {
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            ignoreHTTPSErrors: true,
            args: [
                `--disable-extensions-except=${getPathToEx()}`,
                `--load-extension=${getPathToEx()}`,
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
        const zometPage = new DashboardPage(await context.newPage());
        await zometPage.goToPage();
        await use(zometPage);
    },
    authPageEmptyWallet: async ({ context }, use) => {
        await addWalletToMm(context, seedPhraseEmptyWallet);
        const zometPage = new DashboardPage(await context.newPage());
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
        const swapPage = await zometPage.goToSwap();
        await use(swapPage);
    },
    superSwapPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByTx);
        const superSwapPage = await zometPage.goToSuperSwap();
        await use(superSwapPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboardByMm(context, seedPhraseByTx);
        const sendPage = await zometPage.goToSend();
        await use(sendPage);
    },
});
export const expect = test.expect;
