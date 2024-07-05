import { setCustomRpc } from '../__fixtures__/fixtureHelper';
import { testMetaMaskAndKeplr } from '../__fixtures__/fixtures';
import { METAMASK_DEFAULT_NETWORK_NAME, METAMASK_FAKE_URL_NODE } from '../data/constants';
import {
    mockPostTransactionsRouteEvm,
    mockPostTransactionsWsByCreateEventEvm,
    mockPutTransactionsShortcutBscOsmoRouteMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutBscOsmoMockTx,
} from '../data/mockDataByTests/ShortcutTransferAndStakeMock';

import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';

testMetaMaskAndKeplr('Case#: Shortcut transfer and stake', async ({ context, shortcutPage }) => {
    const expectedNotificationTitle = 'BRIDGE 0.002 BNB';
    const expectedNotificationDesc = 'For 1.186137 OSMO';

    await shortcutPage.clickFirstShortcut();

    await setCustomRpc(context, METAMASK_FAKE_URL_NODE.BSC, METAMASK_DEFAULT_NETWORK_NAME.BSC);

    const finalTxStatusEventPromise = shortcutPage.waitEventInSocket('update_transaction_status');
    await shortcutPage.page.reload();

    await shortcutPage.modifyDataByPostTxRequest(mockPostTransactionsRouteEvm, mockPostTransactionsWsByCreateEventEvm);

    await shortcutPage.modifyDataByGetTxRequest(mockPostTransactionsRouteEvm);

    await shortcutPage.modifyDataByPutTxRequest(
        mockPutTransactionsShortcutBscOsmoRouteMockTx,
        mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutBscOsmoMockTx,
    );

    await shortcutPage.setAmount('0.005');
    await shortcutPage.page.waitForResponse('**/services/bridgedex/getQuote');
    await shortcutPage.page.waitForResponse('**/services/bridgedex/getQuote');
    await shortcutPage.page.waitForResponse('**/services/bridgedex/getQuote');

    await shortcutPage.clickConfirm();

    await shortcutPage.page.getByText('Metamask').click();

    const notifyMMchangeNet = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMMchangeNet.changeNetworkIfNetAlreadyInMm();

    const notifyMmTx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMmTx.signTx();

    await finalTxStatusEventPromise;
    await shortcutPage.assertNotificationByPage(1, expectedNotificationTitle, expectedNotificationDesc);
});
