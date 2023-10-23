import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { getTestVar, TEST_CONST } from '../envHelper';
import { getNotifyMmPage } from '../model/metaMaskPages';

test.describe('Send e2e tests', () => {
    test('Case#1: Send native token to another address in ETH net', async ({ browser, context, page: Page, sendPage }) => {
        const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
        const amount = '0.0001';
        const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);
        await sendPage.clickConfirm();

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        const recipientAddress = await notifyMM.getReceiverAddress();
        const amountFromMM = await notifyMM.getAmount();

        expect(recipientAddress).toBe(addressTo);
        expect(amountFromMM).toBe(amount);

        await expect(sendPage.page).toHaveScreenshot();
        // await notifyMM.signTx();
        // expect(await sendPage.getLinkFromSuccessPanel()).toContain(txHash);
    });
});
