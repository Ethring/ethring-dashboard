import { testKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { emptyBalanceMockData, errorGetBalanceMockData, mockBalanceData, mockBalanceCosmosWallet } from '../data/mockHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { BridgePage, SendPage, SuperSwapPage, SwapPage } from '../model/VueApp/base.pages';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';
import { EVM_NETWORKS, COSMOS_NETWORKS } from '../data/constants';
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

    testMetaMask('Case#: Send page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await dashboardEmptyWallet.mockBalanceRequest('eth', emptyBalanceMockData, address);

        const sendPage = await dashboardEmptyWallet.goToModule('send');
        await sendPage.waitLoadImg();
        await expect(sendPage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    });

    testMetaMask('Case#: Swap page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);

        const swapPage = await dashboardEmptyWallet.goToModule('swap');
        await Promise.all(EVM_NETWORKS.map((network) => swapPage.mockBalanceRequest(network, emptyBalanceMockData, address)));
        await swapPage.waitDetachedSkeleton();
        await swapPage.waitLoadImg();

        await expect(swapPage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    });

    testMetaMask('Case#: Bridge page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await Promise.all(EVM_NETWORKS.map((network) => dashboardEmptyWallet.mockBalanceRequest(network, emptyBalanceMockData, address)));

        const bridgePage: BridgePage = await dashboardEmptyWallet.goToModule('bridge');
        await bridgePage.waitDetachedSkeleton();
        await bridgePage.waitLoadImg();

        await expect(bridgePage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    });

    testMetaMask('Case#: Bridge page if balance request error', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        const bridgePage: BridgePage = await dashboardEmptyWallet.goToModule('bridge');

        await Promise.all(EVM_NETWORKS.map((network) => bridgePage.mockBalanceRequest(network, errorGetBalanceMockData, address, 400)));
        await Promise.all(
            EVM_NETWORKS.map((network) => bridgePage.page.waitForResponse(`**/srv-data-provider/api/balances?net=${network}**`))
        );

        await bridgePage.waitDetachedSkeleton();
        await bridgePage.waitLoadImg();

        await expect(bridgePage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    });

    testMetaMask('Case#: Super swap page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await dashboardEmptyWallet.mockBalanceRequest('eth', emptyBalanceMockData, address);

        const superSwapPage = await dashboardEmptyWallet.goToModule('superSwap');
        await superSwapPage.waitLoadImg();
        await expect(superSwapPage.page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    });
});

testMetaMask.describe('MetaMask dashboard', () => {
    testMetaMask('Case#: Check ETH protocol view', async ({ browser, context, page, dashboardProtocol }) => {
        const address = getTestVar(TEST_CONST.ETH_ADDRESS_BY_PROTOCOL_TEST);

        await Promise.all(EVM_NETWORKS.map((network) => dashboardProtocol.mockBalanceRequest(network, mockBalanceData[network], address)));

        await dashboardProtocol.prepareFoScreenShoot();
        await dashboardProtocol.setFocusToFirstSpan();

        await expect(dashboardProtocol.page).toHaveScreenshot({ fullPage: true });
    });
});

testKeplr.describe('Keplr dashboard', () => {
    testKeplr('Case#: Dashboard page', async ({ browser, context, page, dashboard }) => {
        await dashboard.prepareFoScreenShoot();
        await dashboard.setFocusToFirstSpan();

        await expect(dashboard.page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
    });
});

testKeplr.describe('Keplr dashboard', () => {
    testKeplr('Case#: check protocols & nfts view', async ({ browser, context, page, dashboardProtocol }) => {
        const NETWORK_NAME_BALANCE_ERROR = 'juno';
        const CORRECT_BALANCE_NETWORKS = { ...COSMOS_NETWORKS } as Partial<typeof COSMOS_NETWORKS>;
        delete CORRECT_BALANCE_NETWORKS.juno;

        dashboardProtocol.mockBalanceRequest(
            NETWORK_NAME_BALANCE_ERROR,
            errorGetBalanceMockData,
            COSMOS_NETWORKS[NETWORK_NAME_BALANCE_ERROR],
            500
        );

        await Promise.all(
            Object.keys(CORRECT_BALANCE_NETWORKS).map((network) =>
                dashboardProtocol.mockBalanceRequest(network, mockBalanceCosmosWallet[network], COSMOS_NETWORKS[network])
            )
        );
        await dashboardProtocol.prepareFoScreenShoot();

        await dashboardProtocol.setFocusToFirstSpan();

        await expect(dashboardProtocol.page).toHaveScreenshot({ fullPage: true });
    });
});
