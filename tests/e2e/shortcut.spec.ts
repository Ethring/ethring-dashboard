import { expect } from '@playwright/test';
import util from 'util';

import { testMetaMaskAndKeplr } from '../__fixtures__/fixtures';
import {
    estimateBscOsmoMock,
    estimateCosmoStargazeMock,
    estimateOsmoCosmosMock,
    mockPostTransactionsRouteEvm,
    mockPostTransactionsWsByCreateEventEvm,
    mockPutTransactionsShortcutBscOsmoRouteMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutBscOsmoMockTx,
} from '../data/mockDataByTests/ShortcutTransferAndStakeMock';

import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';

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

    const notifyMmTx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMmTx.signTx();

    await shortcutPage.assertNotificationByPage(1, expectedNotificationTitle, expectedNotificationDesc);
    // TODO this assert work with wait notification
});

testMetaMaskAndKeplr('Case#: Shortcut disconnect wallet', async ({ context, shortcutPage }) => {
    await shortcutPage.clickFirstShortcut();

    await sleep(FIVE_SECONDS);

    await shortcutPage.disconnectAllWallets();

    await expect(shortcutPage.page).toHaveScreenshot(); // must be stay at shortcut page
});
