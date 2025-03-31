import { testMetaMask } from '../__fixtures__/fixtures';
import { mockBalanceDataBySendTest } from '../data/mockHelper';
import { getTestVar, TEST_CONST } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import util from 'util';
import {
    mockPostTransactionsRouteSendMockTx,
    mockPostTransactionsWsByCreateEventSendMockTx,
    mockPutTransactionsRouteSendMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendMockTx,
} from '../data/mockDataByTests/SendTxPolygonMock';
import { METAMASK_FAKE_URL_NODE } from '../data/constants';
import { setCustomRpc } from '../__fixtures__/fixtureHelper';

const sleep = util.promisify(setTimeout);

testMetaMask.describe('Mocked send tx Metamask', () => {
    // TODO: Change to another network
    testMetaMask.skip('Case#: Send tx in Polygon', async ({ browser, context, page, sendPage }) => {
        const network = 'Polygon';
        const networkNameInMM = 'Polygon Mainnet';
        const networkSymbol = 'POL';
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
        const amount = '0.001';
        const WAITED_URL = `**/srv-data-provider/api/balances?net=${network.toLowerCase()}**`;
        const expectedNotificationTitle = 'Transaction SUCCESS';
        const expectedNotificationDesc = '';

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest[network.toLowerCase()], addressFrom);
        const balancePromise = sendPage.page.waitForResponse(WAITED_URL);
        await balancePromise;

        await setCustomRpc(context, METAMASK_FAKE_URL_NODE.POLYGON, networkNameInMM, networkSymbol);

        const finalTxStatusEventPromise = sendPage.waitEventInSocket('update_transaction_status');
        await sendPage.page.reload();

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

        const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMMtx.signTx();

        await finalTxStatusEventPromise;
        await sendPage.assertNotificationByPage(1, expectedNotificationTitle, expectedNotificationDesc);
    });
});
