import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';

test('Case#999: Verifying data reset when navigating to swap page', async ({ page: Page, superSwapPage }) => {
    await superSwapPage.setNetworkToWithSleep('Arbitrum One');
    const tokenInSuperSwap = superSwapPage.getTokenTo();

    const swapPage = await superSwapPage.goToSwap();
    await swapPage.page.waitForLoadState();
    const currentTokenTo = await swapPage.getTokenTo();

    expect(tokenInSuperSwap).not.toBe(currentTokenTo);
});
