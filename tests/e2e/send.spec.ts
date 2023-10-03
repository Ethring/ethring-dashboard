import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';

test.describe('Send e2e tests', () => {
    test('Case#1: Send native token to another address in ETH net', async ({ browser, context, page: Page, sendPage }) => {
        const addressTo: string = process.env.TEST_RECEVIER_ADDRESS;

        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount('0.0001');
        await sendPage.clickConfirm();

        const notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
        const resicerAddress = await notyfMM.getReciverAddress();
        expect(resicerAddress).toBe(addressTo);
        await notyfMM.signTx();

        expect(await sendPage.getLinkFromSuccessPanell()).toContain('0x722a02331325f538c740391d0d0948935250e19eda6cf355b0c89198d2f8a0e4');
    });
});
