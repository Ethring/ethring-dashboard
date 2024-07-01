import { testMetaMask, testMetaMaskAndKeplr } from '../__fixtures__/fixtures';
import {
    estimateBscOsmoMock,
    estimateCosmoStargazeMock,
    estimateOsmoCosmosMock,
    mockPostTransactionsRouteEvm,
    mockPostTransactionsWsByCreateEventEvm,
    mockPutTransactionsShortcutBscOsmoRouteMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutBscOsmoMockTx,
} from '../data/mockDataByTests/ShortcutTransferAndStakeMock';

// import {
//     MOCK_ARBITRUM_TX_HASH,
//     mockTxReceiptPendleStep1,
//     mockPostTransactionsWsByCreateEventArbitrum,
//     mockPostTransactionsRouteArbitrum,
//     mockPutTransactionsShortcutPendleBeefy,
//     mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutPendleBeefyTx,
// } from '../data/mockDataByTests/ShortcutPendleBeefy';

import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import util from 'util';

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

// testMetaMask.skip('Case#: Shortcut Pendle - Beefy', async ({ context, shortcutPage }) => {
//     const mockGetQuote = {
//         '"fromToken":"0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","toToken":"0x2416092f143378750bb29b79ed961ab195cceea5"':
//             estimateArbitrumMock,
//     };

//     await shortcutPage.clickShortcutById('SC-pendle-beefy');

//     await shortcutPage.mockEstimateDexRequestByRequestDataMatcher(mockGetQuote);

//     await shortcutPage.setAmount('0.00051');

//     await shortcutPage.modifyDataByPostTxRequest(mockPostTransactionsRouteArbitrum, mockPostTransactionsWsByCreateEventArbitrum);

//     await shortcutPage.modifyDataByGetTxRequest(mockPostTransactionsRouteArbitrum);

//     await shortcutPage.modifyDataByPutTxRequest(
//         mockPutTransactionsShortcutPendleBeefy,
//         mockPutTransactionsWsByUpdateTransactionEventInProgressShortcutPendleBeefyTx,
//     );

//     await shortcutPage.clickConfirm();

//     const notifyMmAddNetwork = new MetaMaskNotifyPage(await getNotifyMmPage(context));
//     await notifyMmAddNetwork.changeNetwork();

//     const notifyMmTxSwap = new MetaMaskNotifyPage(await getNotifyMmPage(context));
//     //   await notifyMmTxSwap.signTx();

//     // await shortcutPage.modifyDataByPostTxRequest(mockPostTransactionsRouteArbitrum, mockPostTransactionsWsByCreateEventArbitrum);

//     // await shortcutPage.modifyDataByGetTxRequest(mockPostTransactionsRouteArbitrum);

//     // const notifyMmTxApprove = new MetaMaskNotifyPage(await getNotifyMmPage(context));
//     // await notifyMmTxApprove.signTx();
// });
