import { METAMASK_DEFAULT_URL_NODE } from 'tests/data/constants';
import { testMetaMaskAndKeplr } from '../__fixtures__/fixtures';
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
import util from 'util';
import { expect } from '@playwright/test';
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
