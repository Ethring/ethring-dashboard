import { test as base, chromium, type BrowserContext, Browser } from '@playwright/test';
import path from 'path';
import { MetaMaskHomePage, MetaMaskNotifyPage, waitMmNotifyWindow } from '../model/metaMaskPages';
import { DashboardPage, SwapPage, SuperSwapPage, SendPage } from '../model/zometPages';

export const metaMaskId = 'lbbfnfejpmmaenbngdgdmpabdfgiceii';
const getPathToEx = () => path.join(__dirname, '..', '/data/metamask-chrome-10.34.0');

const authInDashboard = async (context: BrowserContext): Promise<DashboardPage> => {
    await waitMmNotifyWindow();
    await context.pages()[0].close();
    await context.pages()[0].close();

    const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
    await metaMaskPage.importExistWallet();

    const zometPage = new DashboardPage(await context.newPage());
    await zometPage.goToPage();
    await zometPage.loginByMetaMask();
    let notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
    await notyfMM.assignPage();
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
        let context;
        if (process.env.CI) {
            context = await chromium.launchPersistentContext('', {
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
                    // '--headless=new'
                ],
            });
        } else {
            context = await chromium.launchPersistentContext('', {
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
                ],
            });
        }

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
