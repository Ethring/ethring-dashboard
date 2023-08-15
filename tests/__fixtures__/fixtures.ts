import { test as base, chromium, type BrowserContext, Browser } from '@playwright/test';
import path from 'path';
import { MetaMaskHomePage, MetaMaskNotifyPage, waitMmNotifyWindow } from '../model/metaMaskPages';
import { DashboardPage, SwapPage, SuperSwapPage } from '../model/zometPages';

const getPathToEx = () => path.join(__dirname, '..', '/data/metamask-chrome-10.34.0');
export const metaMaskId = 'lbbfnfejpmmaenbngdgdmpabdfgiceii';

export const test = base.extend<{
    context: BrowserContext | Browser;
    swapPage: SwapPage;
    superSwapPage: SuperSwapPage;
}>({
    context: async ({}, use) => {
        let context;
        if (process.env.CI) {
            context = '';
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
        let [background] = context.serviceWorkers();

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

        const swapPage = await zometPage.goToSwap();
        await use(swapPage);
    },
    superSwapPage: async ({ context }, use) => {
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

        const superSwapPage = await zometPage.goToSuperSwap();
        await use(superSwapPage);
    },
});
export const expect = test.expect;
