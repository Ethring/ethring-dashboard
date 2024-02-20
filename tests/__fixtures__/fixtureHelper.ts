import path from 'path';

import { BrowserContext } from '@playwright/test';
import { MetaMaskHomePage, MetaMaskNotifyPage, getNotifyMmPage, metamaskVersion } from '../model/MetaMask/MetaMask.pages';
import { KeplrHomePage, KeplrNotifyPage, getNotifyKeplrPage, keplrVersion } from '../model/Keplr/Keplr.pages';
import { COSMOS_NETWORKS, EVM_NETWORKS } from '../data/constants';
import mockTokensListData from '../data/mockTokensListData';
import { DashboardPage } from '../model/VueApp/base.pages';
import {
    errorGetBalanceMockData,
    marketCapNativeEvmTokens,
    mockBalanceCosmosWallet,
    mockBalanceDataBySendTest,
    mockBalanceDataBySwapTest,
} from '../data/mockHelper';
import util from 'util';

export const FIVE_SECONDS = 5000;
export const ONE_SECOND = 1000;

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

export const addWalletToMm = async (context: BrowserContext, seed: string) => {
    await sleep(FIVE_SECONDS); // wait for page load
    await closeEmptyPages(context);
    const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
    await metaMaskPage.addWallet(seed);
    return;
};

export const addWalletToKeplr = async (context: BrowserContext, seed: string) => {
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

export const authInDashboardByMm = async (context: BrowserContext, seed: string): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authMmCoingeckoAndBalanceMockBySendTest = async (
    context: BrowserContext,
    seed: string,
    address: string,
): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);

    const COINGECKO_ROUTE = '**/marketcaps/coingecko?**';
    context.route(COINGECKO_ROUTE, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json; charset=utf-8',
            body: JSON.stringify(marketCapNativeEvmTokens),
        });
    });

    const zometPage = new DashboardPage(await context.newPage());
    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockBalanceRequest(network, mockBalanceDataBySendTest[network], address)));

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authInDashboardByMmTokensListMock = async (context: BrowserContext, seed: string): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockTokensList(network, mockTokensListData[network])));

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authMm_BalanceSwapAndTokensListMock = async (
    context: BrowserContext,
    seed: string,
    address: string,
): Promise<DashboardPage> => {
    const coingeckoUrl = '**/token-price/coingecko/ethereum**';
    const coingeckoPriceLonData = {
        ok: true,
        data: {
            '0x0000000000095413afc295d19edeb1ad7b71c952': {
                usd: 0.643215,
                btc: 0.00001605,
            },
        },
        error: [],
    };

    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    await zometPage.mockRoute(coingeckoUrl, coingeckoPriceLonData);
    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockTokensList(network, mockTokensListData[network])));
    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockBalanceRequest(network, mockBalanceDataBySwapTest[network], address)));

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authInDashboardByKeplr = async (context: BrowserContext, seed: string) => {
    await addWalletToKeplr(context, seed);

    const zometPage = new DashboardPage(await context.newPage());

    const NETWORK_NAME_BALANCE_ERROR = 'juno';
    const CORRECT_BALANCE_NETWORKS = { ...COSMOS_NETWORKS } as Partial<typeof COSMOS_NETWORKS>;
    delete CORRECT_BALANCE_NETWORKS.juno;

    zometPage.mockBalanceRequest(NETWORK_NAME_BALANCE_ERROR, errorGetBalanceMockData, COSMOS_NETWORKS[NETWORK_NAME_BALANCE_ERROR], 500);
    await Promise.all(
        Object.keys(CORRECT_BALANCE_NETWORKS).map((network) =>
            zometPage.mockBalanceRequest(network, mockBalanceCosmosWallet[network], COSMOS_NETWORKS[network]),
        ),
    );
    await zometPage.goToPage();

    await zometPage.clickLoginByKeplr();
    const notifyKeplr = new KeplrNotifyPage(await getNotifyKeplrPage(context));
    await notifyKeplr.assignPage();

    await zometPage.waitMainElementVisible();

    await Promise.all(
        Object.keys(COSMOS_NETWORKS).map((network) => zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)),
    );
    return zometPage;
};
