import { testMetaMaskMockTx } from '../__fixtures__/fixtures';
import { expect, test } from '@playwright/test';
import {
    mockBalanceDataBySendTest,
    mockPostTransactionsRouteSendMockTx,
    mockPostTransactionsWsByCreateEventSendMockTx,
    mockPutTransactionsRouteSendMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendMockTx,
} from '../data/mockHelper';
import { getTestVar, TEST_CONST } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import util from 'util';

const sleep = util.promisify(setTimeout);

test.describe('Mocked send tx Metamask', () => {
    testMetaMaskMockTx('Case#: Send tx in Polygon', async ({ browser, context, page, sendPage }) => {
        const network = 'Polygon';
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
        const amount = '0.001';
        const WAITED_URL = `**/srv-data-provider/api/balances?net=${network.toLowerCase()}**`;

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest[network.toLowerCase()], addressFrom);
        const balancePromise = sendPage.page.waitForResponse(WAITED_URL);
        await balancePromise;

        await sendPage.changeNetwork(network);
        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);

        await sleep(2000);

        await sendPage.modifyDataByPostTxRequest(mockPostTransactionsRouteSendMockTx, mockPostTransactionsWsByCreateEventSendMockTx);
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

        expect(sendPage.page).toHaveScreenshot({
            maxDiffPixels: 180, // This diff is text on notification modal
            mask: [sendPage.page.locator('//header'), sendPage.page.locator('//aside')],
        });
    });
});
