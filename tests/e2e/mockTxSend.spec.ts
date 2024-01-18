import { testMetaMaskMockTx } from '../__fixtures__/fixtures';
import { mockBalanceDataBySendTest } from '../data/mockHelper';
import { getTestVar, TEST_CONST } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';

const sleep = require('util').promisify(setTimeout);

testMetaMaskMockTx.describe('Mocked send tx Metamask', () => {
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
        await sendPage.clickConfirm();

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMM.changeNetwork();

        const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMMtx.signTx();

        await sleep(15000);
    });
});
