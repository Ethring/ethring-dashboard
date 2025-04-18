import { expect } from '@playwright/test';
import util from 'util';
import { testMetaMask } from 'tests/__fixtures__/fixtures';
import { EVM_NETWORKS, IGNORED_LOCATORS } from '../data/constants';
import { emptyBalanceMockData } from 'tests/data/mockHelper';
import { getTestVar, TEST_CONST } from 'tests/envHelper';
import { BridgePage } from 'tests/model/VueApp/base.pages';

const sleep = util.promisify(setTimeout);

testMetaMask('Case#: Bridge page', async ({ browser, context, page, dashboardEmptyWallet }) => {
    const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
    await Promise.all(EVM_NETWORKS.map((network) => dashboardEmptyWallet.mockBalanceRequest(network, emptyBalanceMockData, address)));

    const bridgePage: BridgePage = await dashboardEmptyWallet.goToModule('bridge');
    await bridgePage.waitDetachedSkeleton();
    await bridgePage.waitLoadImg();

    await sleep(5000);

    await expect(bridgePage.page).toHaveScreenshot({
        mask: [bridgePage.page.locator(IGNORED_LOCATORS.HEADER), bridgePage.page.locator(IGNORED_LOCATORS.ASIDE)],
    });
});

testMetaMask('Case#: Bridge page if balance request error', async ({ browser, context, page, dashboardAllBalanceError }) => {
    const bridgePage: BridgePage = await dashboardAllBalanceError.goToModule('bridge');

    await bridgePage.waitDetachedSkeleton();
    await bridgePage.waitLoadImg();

    await bridgePage.setAmount('1');

    await sleep(5000);

    await expect(bridgePage.page).toHaveScreenshot({
        mask: [bridgePage.page.locator(IGNORED_LOCATORS.HEADER), bridgePage.page.locator(IGNORED_LOCATORS.ASIDE)],
    });
});
