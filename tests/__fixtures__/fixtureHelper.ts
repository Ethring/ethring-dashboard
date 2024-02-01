import path from 'path';

import { BrowserContext } from '@playwright/test';
import { MetaMaskHomePage, MetaMaskNotifyPage, getNotifyMmPage, metamaskVersion } from '../model/MetaMask/MetaMask.pages';
import { KeplrHomePage, KeplrNotifyPage, getNotifyKeplrPage, keplrVersion } from '../model/Keplr/Keplr.pages';
import { EVM_NETWORKS } from '../data/constants';
import mockTokensListData from '../data/mockTokensListData';
import { DashboardPage } from '../model/VueApp/base.pages';
import { marketCapNativeEvmTokens } from '../data/mockHelper';
import util from 'util';

export const FIVE_SECONDS = 5000;

const sleep = util.promisify(setTimeout);

const closeEmptyPages = async (context: BrowserContext) => {
    const allStartPages = context.pages();

    for (const page of allStartPages) {
        const pageTitle = await page.title();
        if (!pageTitle) {
            await page.close({
                reason: 'empty',
                runBeforeUnload: true,
            });
        }
    }
};

export const getPathToMmExtension = () => {
    return path.join(process.cwd(), `/data/metamask-chrome-${metamaskVersion}`);
};

export const getPathToKeplrExtension = () => {
    return path.join(process.cwd(), `/data/keplr-extension-manifest-v2-v${keplrVersion}`);
};

export const addWalletToMm = async (context: BrowserContext, seed: String) => {
    await sleep(FIVE_SECONDS); // wait for page load
    await closeEmptyPages(context);
    const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
    await metaMaskPage.addWallet(seed);
    return;
};

export const addWalletToKeplr = async (context: BrowserContext, seed: String) => {
    await sleep(FIVE_SECONDS); // wait for page load

    await closeEmptyPages(context);
    const keplrPage = new KeplrHomePage(context.pages()[0]);
    await keplrPage.addWallet(seed);
};

const __loginByMmAndWaitElement__ = async (context: BrowserContext, page: DashboardPage): Promise<DashboardPage> => {
    await page.goToPage();

    await page.clickLoginByMetaMask(context);
    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.assignPage();

    const providerModal = page.page.getByText('Connection Successful');
    await providerModal.waitFor({ state: 'detached', timeout: 20000 });

    await page.waitMainElementVisible();
    return page;
};

export const authInDashboardByMm = async (context: BrowserContext, seed: String): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authInDashboardByMmCoingeckoMock = async (context: BrowserContext, seed: String): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    const COINGECKO_ROUTE = '**/marketcaps/coingecko';
    await zometPage.mockRoute(COINGECKO_ROUTE, marketCapNativeEvmTokens);

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authInDashboardByMmTokensListMock = async (context: BrowserContext, seed: String): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockTokensList(network, mockTokensListData[network])));

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authInDashboardByKeplr = async (context: BrowserContext, seed: String) => {
    await addWalletToKeplr(context, seed);

    const zometPage = new DashboardPage(await context.newPage());
    await zometPage.goToPage();

    await zometPage.clickLoginByKeplr();
    const notifyKeplr = new KeplrNotifyPage(await getNotifyKeplrPage(context));
    await notifyKeplr.assignPage();

    await zometPage.waitMainElementVisible();
    return zometPage;
};
