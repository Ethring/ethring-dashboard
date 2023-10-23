import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';

test.describe('Auth page tests', () => {
    test('Case#3: Auth by MM, empty wallet', async ({ browser, context, page: Page, authPageEmptyWallet }) => {
        await expect(authPageEmptyWallet.page).toHaveScreenshot();
    });
});
