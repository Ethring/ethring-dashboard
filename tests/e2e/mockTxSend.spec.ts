import { testMetaMaskMockTx } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { mockBalanceDataBySendTest } from '../data/mockHelper';
import { getTestVar, TEST_CONST } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage, mockMetaMaskSignTransaction } from '../model/MetaMask/MetaMask.pages';
import util from 'util';
import {
    mockPostTransactionsRouteSendMockTx,
    mockPostTransactionsWsByCreateEventSendMockTx,
    mockPutTransactionsRouteSendMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendMockTx,
    mockTxReceipt,
} from '../data/mockDataByTests/SendTxPolygonMock';

const sleep = util.promisify(setTimeout);

testMetaMaskMockTx.describe('Mocked send tx Metamask', () => {
    testMetaMaskMockTx('Case#: Send tx in Polygon', async ({ browser, context, page, sendPage }) => {
        const network = 'Polygon';
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
        const amount = '0.001';
        const WAITED_URL = `**/srv-data-provider/api/balances?net=${network.toLowerCase()}**`;
        const URL_MM = `https://polygon-rpc.com/`;
        const expectedNotificationTitle = 'Transaction SUCCESS';
        const expectedNotificationDesc = '';

        await mockMetaMaskSignTransaction(
            context,
            URL_MM,
            '0xd9193bc27c644e2c0db7353daabe4b268b7ba10c707f80de166d55852884a368',
            mockTxReceipt,
        );

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest[network.toLowerCase()], addressFrom);
        const balancePromise = sendPage.page.waitForResponse(WAITED_URL);
        await balancePromise;

        await sendPage.changeNetwork(network);
        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);

        await sleep(2000);

        await sendPage.modifyDataByPostTxRequest(mockPostTransactionsRouteSendMockTx, mockPostTransactionsWsByCreateEventSendMockTx);
        await sendPage.modifyDataByGetTxRequest(mockPostTransactionsRouteSendMockTx);
        await sendPage.modifyDataByPutTxRequest(
            mockPutTransactionsRouteSendMockTx,
            mockPutTransactionsWsByUpdateTransactionEventInProgressSendMockTx,
        );

        await sendPage.clickConfirm();

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMM.changeNetwork();

        const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMMtx.signTx();

        await sleep(2000);

        await sendPage.assertNotificationByPage(1, expectedNotificationTitle, expectedNotificationDesc);
    });
});
