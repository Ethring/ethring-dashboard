import { expect } from '@playwright/test';
import util from 'util';

import { METAMASK_DEFAULT_URL_NODE, DATA_QA_LOCATORS } from 'tests/data/constants';
import { testMetaMaskAndKeplr, testMetaMask } from '../__fixtures__/fixtures';
import {
    estimateBscOsmoMock,
    estimateCosmoStargazeMock,
    estimateOsmoCosmosMock,
    MOCK_EVM_TX_HASH,
    mockPostTransactionsRouteEvm,
    mockPostTransactionsWsByCreateEventEvm,
    mockPutTransactionsShortcutBscOsmoRouteMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutBscOsmoMockTx,
    mockTxReceipt,
} from '../data/mockDataByTests/ShortcutTransferAndStakeMock';

import { MetaMaskNotifyPage, getNotifyMmPage, mockMetaMaskSignTransaction } from 'tests/model/MetaMask/MetaMask.pages';
import { FIVE_SECONDS, ONE_SECOND } from '../__fixtures__/fixtureHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { mockPoolBalanceDataArbitrum, estimateRemoveLpMockData } from '../data/mockHelper';

const sleep = util.promisify(setTimeout);

testMetaMaskAndKeplr.skip('Case#: Shortcut transfer and stake', async ({ context, shortcutPage }) => {
    const expectedNotificationTitle = 'BRIDGE 0.002 BNB';
    const expectedNotificationDesc = 'For 1.186137 OSMO';

    const mockGetQuote = {
        '"fromToken":"0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","toToken":"uosmo"': estimateBscOsmoMock,
        '"fromToken":"uosmo","toToken":"uatom"': estimateOsmoCosmosMock,
        '"fromToken":"uosmo","toToken":"ustars"': estimateCosmoStargazeMock,
    };

    await shortcutPage.clickFirstShortcut();

    await shortcutPage.mockEstimateBridgeRequestByRequestDataMatcher(mockGetQuote);

    await shortcutPage.setAmount('0.002');

    await shortcutPage.modifyDataByPostTxRequest(mockPostTransactionsRouteEvm, mockPostTransactionsWsByCreateEventEvm);

    await shortcutPage.modifyDataByGetTxRequest(mockPostTransactionsRouteEvm);

    await shortcutPage.modifyDataByPutTxRequest(
        mockPutTransactionsShortcutBscOsmoRouteMockTx,
        mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutBscOsmoMockTx,
    );

    await shortcutPage.clickConfirm();

    const notifyMmAddNetwork = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMmAddNetwork.changeNetwork();

    await mockMetaMaskSignTransaction(context, METAMASK_DEFAULT_URL_NODE.BSC, MOCK_EVM_TX_HASH, mockTxReceipt);

    const notifyMmTx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMmTx.signTx();

    await shortcutPage.assertNotificationByPage(1, expectedNotificationTitle, expectedNotificationDesc);
    // TODO this assert work with wait notification
});

testMetaMaskAndKeplr('Case#: Shortcut disconnect wallet', async ({ context, shortcutPage }) => {
    await shortcutPage.clickFirstShortcut();

    await sleep(FIVE_SECONDS);

    await shortcutPage.disconnectAllWallets();

    const currentShortcutTitle = await shortcutPage.page.locator(`//div[@class='shortcut-details']//div[@class='title']`).textContent();

    expect(currentShortcutTitle).toBe('Stake $ATOM with Citadel.one');
});

testMetaMask('Case#: Shortcut remove liquidity from pool', async ({ context, shortcutPage }) => {
    const NET = 'arbitrum';
    const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
    const RemoveLiquidityPoolID = 'SC-remove-liquidity-pool';
    const WAITED_BALANCE_URL = `**/srv-portal-fi-add-portal-fi/api/getUserBalancePoolList?net=${NET}**`;
    const AMOUNT = '0.001';

    await shortcutPage.mockPoolBalanceRequest(NET, mockPoolBalanceDataArbitrum, ADDRESS);
    const balancePromise = shortcutPage.page.waitForResponse(WAITED_BALANCE_URL);

    await balancePromise;

    await sleep(FIVE_SECONDS);

    await shortcutPage.clickShortcutById(RemoveLiquidityPoolID);

    const currentTokenFrom = await shortcutPage.page
        .locator(`//*[@data-qa="select-token"]/div[contains(@class, 'token-symbol')]`)
        .nth(0)
        .textContent();

    expect(currentTokenFrom).toBe(mockPoolBalanceDataArbitrum.data[0].symbol);

    await sleep(ONE_SECOND);

    await shortcutPage.setAmount(AMOUNT);
    await shortcutPage.mockEstimateRemoveLpRequest(estimateRemoveLpMockData, 200);

    await sleep(FIVE_SECONDS);

    const inputToValue = await shortcutPage.page.locator('.ant-form-item .base-input').nth(1).inputValue();

    expect(inputToValue).toBe('0.001012591056390839');

    const confirmButtonTitle = await shortcutPage.page.locator('.module-layout-view-btn').textContent();

    expect(confirmButtonTitle).toBe('Approve');

    await shortcutPage.clickConfirm();
});
