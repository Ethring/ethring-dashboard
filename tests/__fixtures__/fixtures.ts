import { test as base, chromium, type BrowserContext, Browser } from '@playwright/test';
import path from 'path';
import { MetaMaskHomePage, MetaMaskNotifyPage, getNotifyMmPage, closeEmptyPages } from '../model/metaMaskPages';
import { DashboardPage, SwapPage, SuperSwapPage, SendPage } from '../model/zometPages';
import { getTestVar, TEST_CONST } from '../envHelper';

export const metaMaskId = getTestVar(TEST_CONST.MM_ID);
const metamaskVersion = getTestVar(TEST_CONST.MM_VERSION);
const getPathToEx = () => path.join(__dirname, '..', `/data/metamask-chrome-${metamaskVersion}`);

const authInDashboard = async (context: BrowserContext): Promise<DashboardPage> => {
    await closeEmptyPages(context);

    const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
    await metaMaskPage.importExistWallet();

    const zometPage = new DashboardPage(await context.newPage());
    await zometPage.goToPage();
    await zometPage.loginByMetaMask();
    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.assignPage();
    return zometPage;
};

export const test = base.extend<{
    context: BrowserContext;
    dashboard: DashboardPage;
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
                '--disable-http2',

                '--ignore-certificate-errors',

                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                process.env.CI ? '--headless=new' : '',
            ],
        });

        await use(context);
        await context.close();
    },
    swapPage: async ({ context }, use) => {
        const zometPage = await authInDashboard(context);
        const swapPage = await zometPage.goToSwap();
        await use(swapPage);
    },
    superSwapPage: async ({ context }, use) => {
        const zometPage = await authInDashboard(context);
        const superSwapPage = await zometPage.goToSuperSwap();
        await use(superSwapPage);
    },
    sendPage: async ({ context }, use) => {
        const zometPage = await authInDashboard(context);
        const sendPage = await zometPage.goToSend();
        await use(sendPage);
    },
    dashboard: async ({ context }, use) => {
        const zometPage = await authInDashboard(context);
        await use(zometPage);
    },
});
export const expect = test.expect;
