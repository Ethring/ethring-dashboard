import { testKeplr, testMetaMask, testMetaMaskAndKeplr } from '../__fixtures__/fixtures';
import { test, expect } from '@playwright/test';
import { emptyBalanceMockData } from '../data/mockHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { confirmConnectKeplrWallet, confirmConnectMmWallet, FIVE_SECONDS } from '../__fixtures__/fixtureHelper';
import { EVM_NETWORKS, IGNORED_LOCATORS, COSMOS_WALLETS_BY_EMPTY_WALLET } from '../data/constants';
import util from 'util';

const sleep = util.promisify(setTimeout);

test.describe('Auth page tests', () => {
    testMetaMask('Case#: Go to auth page', async ({ browser, context, page, authPageEmptyWallet }) => {
        await authPageEmptyWallet.waitDetachedLoader();
        await expect(authPageEmptyWallet.page).toHaveScreenshot({ mask: [authPageEmptyWallet.page.locator('span.version')] });
    });
});

test.describe('Pages snapshot tests with empty wallet', () => {
    testMetaMask('Case#: Dashboard page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await Promise.all(EVM_NETWORKS.map((network) => dashboardEmptyWallet.mockBalanceRequest(network, emptyBalanceMockData, address)));
        await dashboardEmptyWallet.waitDetachedSkeleton();
        await sleep(FIVE_SECONDS);
        await dashboardEmptyWallet.setFocusToFirstSpan();
        await expect(dashboardEmptyWallet.page).toHaveScreenshot({ mask: [dashboardEmptyWallet.page.locator('span.version')] });
    });

    testMetaMask('Case#: Super swap page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await dashboardEmptyWallet.mockBalanceRequest('eth', emptyBalanceMockData, address);

        const superSwapPage = await dashboardEmptyWallet.goToModule('superSwap');
        await superSwapPage.waitLoadImg();
        await expect(superSwapPage.page).toHaveScreenshot({
            maxDiffPixelRatio: 0.01,
            mask: [superSwapPage.page.locator(IGNORED_LOCATORS.HEADER), superSwapPage.page.locator(IGNORED_LOCATORS.ASIDE)],
        });
    });

    testMetaMaskAndKeplr('Case#: Check balance request call', async ({ browser, context, page, authPage: testPage }) => {
        /* Case: 
        1) Auth by MM and Keplr wallets
        2) Check the balance request calls for all addresses from connected wallets
        3) Disconnect not current wallet
        4) Connect wallet
        5) Check request call for not current wallet
        */

        const EMPTY_ADDRESS_EVM = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await context.pages()[0].close();

        await Promise.all(EVM_NETWORKS.map((network) => testPage.mockBalanceRequest(network, emptyBalanceMockData, EMPTY_ADDRESS_EVM)));
        const evmBalanceRequestPromise = Promise.all(
            EVM_NETWORKS.map((network) => testPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)),
        );

        await Promise.all(
            Object.keys(COSMOS_WALLETS_BY_EMPTY_WALLET).map((network) =>
                testPage.mockBalanceRequest(network, emptyBalanceMockData, COSMOS_WALLETS_BY_EMPTY_WALLET[network]),
            ),
        );
        const cosmosBalancePromise = Promise.all(
            Object.keys(COSMOS_WALLETS_BY_EMPTY_WALLET).map((network) =>
                testPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`),
            ),
        );

        await testPage.clickLoginByMetaMask();
        await confirmConnectMmWallet(context, testPage);
        await testPage.clickLoginByKeplr();
        await confirmConnectKeplrWallet(context, testPage);

        await evmBalanceRequestPromise;
        await cosmosBalancePromise;

        await testPage.disconnectFirstWallet();

        await Promise.all(EVM_NETWORKS.map((network) => testPage.mockBalanceRequest(network, emptyBalanceMockData, EMPTY_ADDRESS_EVM)));
        const evmBalanceSecondRequestPromise = Promise.all(
            EVM_NETWORKS.map((network) => testPage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)),
        );

        await testPage.clickLoginByMetaMask();
        await evmBalanceSecondRequestPromise; // Check if new balance request was really call
    });
});

test.describe('MetaMask dashboard', () => {
    testMetaMask('Case#: Check ETH protocol view', async ({ browser, context, page, dashboardProtocol }) => {
        await dashboardProtocol.prepareFoScreenShoot();
        await dashboardProtocol.setFocusToFirstSpan();
        await sleep(FIVE_SECONDS);

        await expect(dashboardProtocol.page).toHaveScreenshot({
            fullPage: true,
            mask: [dashboardProtocol.page.locator(IGNORED_LOCATORS.HEADER), dashboardProtocol.page.locator(IGNORED_LOCATORS.ASIDE)],
        });
    });
});

test.describe('Keplr dashboard', () => {
    testKeplr('Case#: check protocols & nfts view', async ({ browser, context, page, dashboardProtocol }) => {
        await dashboardProtocol.prepareFoScreenShoot();

        await dashboardProtocol.setFocusToFirstSpan();

        await expect(dashboardProtocol.page).toHaveScreenshot({
            fullPage: true,
            mask: [dashboardProtocol.page.locator(IGNORED_LOCATORS.HEADER), dashboardProtocol.page.locator(IGNORED_LOCATORS.ASIDE)],
        });
    });
});
