import { test, expect } from '../__fixtures__/fixtures';
import { emptyBalanceMockData, errorGetBalanceMockData, mockBalanceData } from '../data/mockHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { BridgePage, SendPage, SwapPage } from '../model/VueApp/base.pages';
import { FIVE_SECONDS } from '../model/utils';

const NETWORKS = ['eth', 'arbitrum', 'optimism', 'bsc', 'polygon', 'fantom', 'avalanche'];
const sleep = require('util').promisify(setTimeout);

test.describe('Auth page tests', () => {
    test('Case#: Go to auth page', async ({ browser, context, page, authPageEmptyWallet }) => {
        await authPageEmptyWallet.waitDetachedLoader();
        await expect(authPageEmptyWallet.page).toHaveScreenshot();
    });
});

test.describe('Pages snapshot tests with empty wallet', () => {
    test('Case#: Dashboard page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await Promise.all(NETWORKS.map((network) => dashboardEmptyWallet.mockBalanceRequest(network, emptyBalanceMockData, address)));
        await dashboardEmptyWallet.waitDetachedSkeleton();
        await sleep(FIVE_SECONDS);

        await expect(dashboardEmptyWallet.page).toHaveScreenshot();
    });

    test('Case#: Send page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await dashboardEmptyWallet.mockBalanceRequest('eth', emptyBalanceMockData, address);

        const sendPage: SendPage = await dashboardEmptyWallet.goToModule('send');
        await expect(sendPage.page).toHaveScreenshot();
    });

    test('Case#: Swap page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);

        const swapPage: SwapPage = await dashboardEmptyWallet.goToModule('swap');
        await Promise.all(NETWORKS.map((network) => swapPage.mockBalanceRequest(network, emptyBalanceMockData, address)));
        await swapPage.waitDetachedSkeleton();

        await expect(swapPage.page).toHaveScreenshot();
    });

    test('Case#: Bridge page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await Promise.all(NETWORKS.map((network) => dashboardEmptyWallet.mockBalanceRequest(network, emptyBalanceMockData, address)));

        const bridgePage: BridgePage = await dashboardEmptyWallet.goToModule('bridge');
        await bridgePage.waitDetachedSkeleton();

        await expect(bridgePage.page).toHaveScreenshot();
    });

    test('Case#: Bridge page if balance request error', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        const bridgePage: BridgePage = await dashboardEmptyWallet.goToModule('bridge');

        await Promise.all(NETWORKS.map((network) => bridgePage.mockBalanceRequest(network, errorGetBalanceMockData, address, 400)));
        await Promise.all(NETWORKS.map((network) => bridgePage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`)));

        await bridgePage.waitDetachedSkeleton();

        await expect(bridgePage.page).toHaveScreenshot();
    });

    test('Case#: Super swap page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await dashboardEmptyWallet.mockBalanceRequest('eth', emptyBalanceMockData, address);

        const superSwapPage = await dashboardEmptyWallet.goToModule('superSwap');
        await expect(superSwapPage.page).toHaveScreenshot();
    });
});

test.describe('Dashboard page tests', () => {
    test('Case#: Check ETH protocol view', async ({ browser, context, page, dashboardProtocol }) => {
        const address = getTestVar(TEST_CONST.ETH_ADDRESS_BY_PROTOCOL_TEST);

        await Promise.all(NETWORKS.map((network) => dashboardProtocol.mockBalanceRequest(network, mockBalanceData[network], address)));
        await dashboardProtocol.waitDetachedSkeleton();

        await expect(dashboardProtocol.page).toHaveScreenshot({ fullPage: true });
    });
});
