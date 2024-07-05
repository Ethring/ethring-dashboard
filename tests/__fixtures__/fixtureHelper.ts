import { BrowserContext } from '@playwright/test';
import { MetaMaskHomePage, MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import { KeplrHomePage, KeplrNotifyPage, getNotifyKeplrPage } from '../model/Keplr/Keplr.pages';
import { COSMOS_WALLETS_BY_EMPTY_WALLET, EVM_NETWORKS, KeplrDirPath, MetaMaskDirPath } from '../data/constants';
import mockTokensListData from '../data/mockTokensListData';
import { BasePage, DashboardPage } from '../model/VueApp/base.pages';
import {
    emptyBalanceMockData,
    errorGetBalanceMockData,
    marketCapNativeEvmTokens,
    mockBalanceCosmosWallet,
    mockBalanceData,
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
        if (!pageTitle)
            await page.close({
                reason: 'empty',
                runBeforeUnload: true,
            });
    }
};

export const getPathToMmExtension = () => {
    return MetaMaskDirPath;
};

export const getPathToKeplrExtension = () => {
    return KeplrDirPath;
};

export const addWalletToMm = async (context: BrowserContext, seed: string, indexMmHomePage = 0) => {
    await sleep(FIVE_SECONDS); // wait for page load
    await closeEmptyPages(context);
    const metaMaskPage = new MetaMaskHomePage(context.pages()[indexMmHomePage]);
    await metaMaskPage.addWallet(seed);
};

export const addWalletToKeplr = async (context: BrowserContext, seed: string) => {
    await sleep(FIVE_SECONDS); // wait for page load
    await closeEmptyPages(context);
    const keplrPage = new KeplrHomePage(context.pages()[0]);
    await keplrPage.addWallet(seed);
};

//======================================= METAMASK STUFF =======================================

const __loginByMmAndWaitElement__ = async (context: BrowserContext, page: DashboardPage): Promise<DashboardPage> => {
    await page.goToPage();
    await page.clickLoginByMetaMask();
    await confirmConnectMmWallet(context, page);
    return page;
};

export const authByMm = async (context: BrowserContext, seed: string): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authByMmMockEmptyWallets = async (context: BrowserContext, seed: string, address: string): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockBalanceRequest(network, emptyBalanceMockData, address)));

    const lastBalancePromise = zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${EVM_NETWORKS[6]}**`);

    const returnedPage = __loginByMmAndWaitElement__(context, zometPage);
    await lastBalancePromise;
    return returnedPage;
};

export const authByMmMockErrorBalance = async (context: BrowserContext, seed: string, address: string): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockBalanceRequest(network, errorGetBalanceMockData, address, 400)));

    const lastBalancePromise = zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${EVM_NETWORKS[6]}**`);

    const returnedPage = __loginByMmAndWaitElement__(context, zometPage);
    await lastBalancePromise;
    return returnedPage;
};

export const authMmCoingeckoAndBalanceMock = async (
    context: BrowserContext,
    seed: string,
    address: string,
    balanceMock: object = mockBalanceDataBySendTest,
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
    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockBalanceRequest(network, balanceMock[network], address)));

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authByMmTokensListMock = async (context: BrowserContext, seed: string): Promise<DashboardPage> => {
    await addWalletToMm(context, seed);
    const zometPage = new DashboardPage(await context.newPage());

    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockTokensList(network, mockTokensListData[network])));

    return __loginByMmAndWaitElement__(context, zometPage);
};

export const authMmBalanceBySwapAndTokensListMock = async (
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

export const setCustomRpc = async (context: BrowserContext, fakeRpcUrl: string, networkName: string, indexMmHomePage = 0) => {
    const metaMaskPage = new MetaMaskHomePage(context.pages()[indexMmHomePage]);

    await metaMaskPage.addNetwork(networkName);
    await metaMaskPage.changeRpc(networkName, fakeRpcUrl);
};

export const setNetworkInMm = async (context: BrowserContext, networkName: string, indexMmHomePage = 0) => {
    const metaMaskPage = new MetaMaskHomePage(context.pages()[indexMmHomePage]);
    await metaMaskPage.gotoSettings();

    await metaMaskPage.page.locator('//button[@data-testid="network-display"]').click();
    await metaMaskPage.page.locator(`//div[@data-testid='${networkName}']`).click();
};

//======================================= KEPLR STUFF =======================================

export const authByKeplr = async (context: BrowserContext, seed: string, cosmosWallets: any) => {
    await addWalletToKeplr(context, seed);

    const zometPage = new DashboardPage(await context.newPage());

    await Promise.all(
        Object.keys(cosmosWallets).map((network) =>
            zometPage.mockBalanceRequest(network, mockBalanceCosmosWallet[network], cosmosWallets[network]),
        ),
    );
    await zometPage.goToPage();

    await zometPage.clickLoginByKeplr();

    const balancePromise = Promise.all(
        Object.keys(cosmosWallets).map((network) => zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)),
    );
    await confirmConnectKeplrWallet(context, zometPage);
    await balancePromise;

    return zometPage;
};

export const authByKeplrErrorJunoBalanceMock = async (context: BrowserContext, seed: string, cosmosWallets: any) => {
    await addWalletToKeplr(context, seed);

    const zometPage = new DashboardPage(await context.newPage());

    const NETWORK_NAME_BALANCE_ERROR = 'juno';
    const CORRECT_BALANCE_NETWORKS = { ...cosmosWallets };
    delete CORRECT_BALANCE_NETWORKS.juno;

    zometPage.mockBalanceRequest(NETWORK_NAME_BALANCE_ERROR, errorGetBalanceMockData, cosmosWallets[NETWORK_NAME_BALANCE_ERROR], 500);
    await Promise.all(
        Object.keys(CORRECT_BALANCE_NETWORKS).map((network) =>
            zometPage.mockBalanceRequest(network, mockBalanceCosmosWallet[network], cosmosWallets[network]),
        ),
    );
    await zometPage.goToPage();

    await zometPage.clickLoginByKeplr();
    await confirmConnectKeplrWallet(context, zometPage);

    await Promise.all(
        Object.keys(cosmosWallets).map((network) => zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)),
    );

    return zometPage;
};

export const confirmConnectMmWallet = async (context: BrowserContext, page: BasePage) => {
    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.assignPage();

    const providerModal = page.page.getByText('Connection Successful');
    await providerModal.waitFor({ state: 'detached', timeout: 20000 });

    await page.waitMainElementVisible();
};

export const confirmConnectKeplrWallet = async (context: BrowserContext, page: BasePage) => {
    const notifyKeplr = new KeplrNotifyPage(await getNotifyKeplrPage(context));
    await notifyKeplr.assignPage();

    await page.waitMainElementVisible();
};

//======================================= KEPLR  AND MM LOGIN STUFF =======================================

export const authByKeplerAndMmBalanceMock = async (
    context: BrowserContext,
    ethAddress: string,
    ethSeed: string,
    cosmosAddressesDict: object,
    cosmosSeed: string,
) => {
    await addWalletToKeplr(context, cosmosSeed);
    await addWalletToMm(context, ethSeed, 1);

    const zometPage = new BasePage(await context.newPage());
    await zometPage.goToPage();

    await context.pages()[0].close();

    // Mock all EVM balance request
    await Promise.all(EVM_NETWORKS.map((network) => zometPage.mockBalanceRequest(network, mockBalanceData[network], ethAddress)));

    // Create promise by all EMV balance request
    const evmBalanceRequestPromise = Promise.all(
        EVM_NETWORKS.map((network) => zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)),
    );

    // Mock all COSMOS balance request
    await Promise.all(
        Object.keys(cosmosAddressesDict).map((network) =>
            zometPage.mockBalanceRequest(network, mockBalanceCosmosWallet[network], cosmosAddressesDict[network]),
        ),
    );

    // Create promise by all COSMOS balance request
    const cosmosBalancePromise = Promise.all(
        Object.keys(COSMOS_WALLETS_BY_EMPTY_WALLET).map((network) =>
            zometPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`),
        ),
    );

    await zometPage.clickLoginByMetaMask();
    await confirmConnectMmWallet(context, zometPage);
    await zometPage.clickLoginByKeplr();
    await confirmConnectKeplrWallet(context, zometPage);

    await evmBalanceRequestPromise;
    await cosmosBalancePromise;
    return zometPage;
};
