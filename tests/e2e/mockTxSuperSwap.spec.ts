import { expect } from '@playwright/test';
import { testMetaMask } from '../__fixtures__/fixtures';
import { getTestVar, TEST_CONST } from '../envHelper';
import { MetaMaskHomePage, MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import { METAMASK_FAKE_URL_NODE } from '../data/constants';
import {
    mockPostTransactionsRouteSuperSwapMockTx,
    mockPostTransactionsWsByCreateEventSuperSwapMockTx,
    mockPutTransactionsRouteSuperSwapMockTx,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSuperSwapMockTx,
} from '../data/mockDataByTests/superSwapTxPolygonMock';
import util from 'util';

const sleep = util.promisify(setTimeout);

testMetaMask.describe('SuperSwap e2e tests', () => {
    testMetaMask(
        'Case#: Super Swap tx:swap net:Polygon tokenFrom:Matic tokenTo:1inch',
        async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {
            const netTo = 'Polygon';
            const amount = '0.0265';
            const tokenTo = '1INCH';
            const expectedNotificationTitleDeclineTx = 'Transaction error';
            const expectedNotificationDescDeclineTx = 'MetaMask Tx Signature: User denied transaction signature.';
            const expectedNotificationTitleSuccessTx = 'SWAP 0.0265 MATIC';
            const expectedNotificationDescSuccessTx = 'For 0.316757 1INCH';

            const finalTxStatusEventPromise = superSwapPage.waitEventInSocket('update_transaction_status');
            await sleep(3000);
            await superSwapPage.page.reload();
            await sleep(3000);

            await superSwapPage.setFromNetAndAmount(netTo, amount);
            await superSwapPage.setNetToAndTokenTo(netTo, tokenTo);
            await superSwapPage.openRouteInfo();

            // await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot();

            await superSwapPage.modifyDataByPostTxRequest(
                mockPostTransactionsRouteSuperSwapMockTx,
                mockPostTransactionsWsByCreateEventSuperSwapMockTx,
            );
            await superSwapPage.modifyDataByGetTxRequest(mockPostTransactionsRouteSuperSwapMockTx);
            await superSwapPage.modifyDataByPutTxRequest(
                mockPutTransactionsRouteSuperSwapMockTx,
                mockPutTransactionsWsByUpdateTransactionEventInProgressSuperSwapMockTx,
            );

            await superSwapPage.clickConfirm();
            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
            await notifyMM.changeNetwork();

            const notifyMM2 = new MetaMaskNotifyPage(await getNotifyMmPage(context));
            await notifyMM2.rejectTx();
            await superSwapPage.assertNotificationByPage(1, expectedNotificationTitleDeclineTx, expectedNotificationDescDeclineTx);

            const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
            await metaMaskPage.changeRpc(netTo, METAMASK_FAKE_URL_NODE.POLYGON);

            await superSwapPage.clickConfirm();

            const notifyMM3 = new MetaMaskNotifyPage(await getNotifyMmPage(context));
            await notifyMM3.signTx();

            await finalTxStatusEventPromise;
            await superSwapPage.assertNotificationByPage(1, expectedNotificationTitleSuccessTx, expectedNotificationDescSuccessTx);
        },
    );

    testMetaMask.skip(
        'Case#: Super Swap tx from ETH to BSC wEth to USDC',
        async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {
            const netTo = 'Binance Smart Chain';
            const amount = '0.01';
            const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

            await superSwapPage.setNetToAndTokenTo(netTo, amount);

            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            await expect(superSwapPage.page).toHaveScreenshot();
            // await notifyMM.signTx();

            // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);
        },
    );
});
