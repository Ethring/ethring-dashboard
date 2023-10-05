import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { getTestVar, TEST_CONST } from '../envHelper';
import { getNotifyMmPage } from '../model/metaMaskPages';

test.describe('Send e2e tests', () => {
    test('Case#1: Send native token to another address in ETH net', async ({ browser, context, page: Page, sendPage }) => {
        const addressTo = getTestVar(TEST_CONST.TEST_RECIPIENT_ADDRESS);
        const amount = '0.0001';
        const SUCCESS_HASH = '0x722a02331325f538c740391d0d0948935250e19eda6cf355b0c89198d2f8a0e4';

        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);
        await sendPage.clickConfirm();

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        const recipientAddress = await notifyMM.getReceiverAddress();

        expect(recipientAddress).toBe(addressTo);

        await notifyMM.signTx();

        expect(await sendPage.getLinkFromSuccessPanel()).toContain(SUCCESS_HASH);
    });
});
