import { testKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { test, expect } from '@playwright/test';
import { emptyBalanceMockData, mockBalanceData } from '../data/mockHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';
import { EVM_NETWORKS, IGNORED_LOCATORS } from '../data/constants';
import util from 'util';

const sleep = util.promisify(setTimeout);

testMetaMask.describe('Auth page tests', () => {
    testMetaMask('Case#: Go to auth page', async ({ browser, context, page, authPageEmptyWallet }) => {
        await authPageEmptyWallet.waitDetachedLoader();
        await expect(authPageEmptyWallet.page).toHaveScreenshot();
    });
});

testMetaMask.describe('Pages snapshot tests with empty wallet', () => {
    testMetaMask('Case#: Dashboard page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await Promise.all(EVM_NETWORKS.map((network) => dashboardEmptyWallet.mockBalanceRequest(network, emptyBalanceMockData, address)));
        await dashboardEmptyWallet.waitDetachedSkeleton();
        await sleep(FIVE_SECONDS);
        await dashboardEmptyWallet.setFocusToFirstSpan();
        await expect(dashboardEmptyWallet.page).toHaveScreenshot();
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
});

testMetaMask.describe('MetaMask dashboard', () => {
    testMetaMask('Case#: Check ETH protocol view', async ({ browser, context, page, dashboardProtocol }) => {
        const address = getTestVar(TEST_CONST.ETH_ADDRESS_BY_PROTOCOL_TEST);

        await Promise.all(EVM_NETWORKS.map((network) => dashboardProtocol.mockBalanceRequest(network, mockBalanceData[network], address)));

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
