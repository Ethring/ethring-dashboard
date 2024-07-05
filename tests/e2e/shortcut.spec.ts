import { expect } from '@playwright/test';
import util from 'util';

import { testMetaMaskAndKeplr } from '../__fixtures__/fixtures';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';

const sleep = util.promisify(setTimeout);

testMetaMaskAndKeplr('Case#: Shortcut disconnect wallet', async ({ context, shortcutPage }) => {
    await shortcutPage.clickFirstShortcut();

    await sleep(FIVE_SECONDS);

    await shortcutPage.disconnectAllWallets();

    await expect(shortcutPage.page).toHaveScreenshot(); // must be stay at shortcut page
});
