import { BrowserContext, expect, type Locator, type Page } from '@playwright/test';
import { metaMaskId } from '../__fixtures__/fixtures';
import { getTestVar, TEST_CONST } from '../envHelper';

const sleep = require('util').promisify(setTimeout);

const password = getTestVar(TEST_CONST.PASS_BY_MM_WALLET);

export const sleepFiveSecond = async () => {
    await sleep(5000);
};

export const waitMmNotifyPage = async (context: BrowserContext) => {
    try {
        await sleepFiveSecond();
        await context.pages()[2].title();
    } catch (error) {
        console.error('First try get mm notify page is failed.', error, ' Second try...');
        await sleepFiveSecond();
        await context.pages()[2].title();
    }
};

export const getNotifyMmPage = async (context: BrowserContext): Promise<Page> => {
    const expectedMmPageTitle = 'MetaMask Notification';

    await waitMmNotifyPage(context);

    const notifyPage = context.pages()[2];
    const titlePage = await notifyPage.title();

    if (titlePage !== expectedMmPageTitle) {
        throw new Error(`Oops, this is did not notify MM page. Current title ${titlePage}`);
    }

    return notifyPage;
};

export const closeEmptyPages = async (context: BrowserContext) => {
    await sleepFiveSecond();
    const allStartPages = context.pages();

    for (const page of allStartPages) {
        const pageTitle = await page.title();
        if (pageTitle === '') {
            await page.close();
        }
    }
};

export class MetaMaskHomePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto(`chrome-extension://${metaMaskId}/home.html`);
    }

    async goToWelcome() {
        await this.page.goto(`chrome-extension://${metaMaskId}/home.html#onboarding/welcome`);
    }

    async gotoSignPage() {
        await this.page.goto(`chrome-extension://${metaMaskId}/home.html#confirm-transaction/`);
    }

    async gotoNotificationPage() {
        await this.page.goto(`chrome-extension://${metaMaskId}/notification.html`);
    }

    async addWallet(seed: String) {
        await sleepFiveSecond();
        await this.page.reload();
        await this.page.locator('input[data-testid=onboarding-terms-checkbox]').click();
        await this.page.locator('button[data-testid=onboarding-import-wallet]').click();
        await this.page.locator('button[data-testid=metametrics-i-agree]').click();

        const seedArray = seed.split(' ');
        for (let i = 0; i < seedArray.length; i++) {
            await this.page.locator(`input[data-testid=import-srp__srp-word-${i}]`).fill(seedArray[i]);
        }
        await this.page.click('[data-testid="import-srp-confirm"]');
        await this.page.fill('input[data-testid=create-password-new]', password);
        await this.page.fill('input[data-testid=create-password-confirm]', password);
        await this.page.locator('input[data-testid=create-password-terms]').click();
        await this.page.click('[data-testid="create-password-import"]');
        await this.page.click('[data-testid="onboarding-complete-done"]');
        await this.page.click('[data-testid="pin-extension-next"]');
        await this.page.click('[data-testid="pin-extension-done"]');
        await this.page.getByText('Try it out').click();
        await this.page.getByText('Enable smart swaps').click();
    }

    async unlockWallet() {
        await this.page.fill('[data-testid="unlock-password"]', password);
        await this.page.click('[data-testid="unlock-submit"]');
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.reload();
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async getPage() {
        return this.page;
    }

    async addNetwork(network: String) {
        await this.page.locator('[data-testid="network-display"]').click();
        await this.page.getByText('Добавить сеть').click();
    }
}

export class MetaMaskNotifyPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async assignPage() {
        await this.page.click('[data-testid="page-container-footer-next"]');
        await this.page.click('[data-testid="page-container-footer-next"]');
    }

    async signTx() {
        await this.page.click('[data-testid="page-container-footer-next"]');
    }

    async getReceiverAddress() {
        await this.page.click('[data-testid="sender-to-recipient__name"]');
        const result = await this.page.innerText('div.nickname-popover__public-address__constant');
        await this.page.click('[data-testid="popover-close"]');
        return result;
    }

    async getAmount() {
        const amount = await this.page.innerText('h3.mm-text span.currency-display-component__text');
        return amount;
    }

    async addAndAcceptChangeNetwork() {
        await this.page.locator('//button[@class="button btn--rounded btn-primary"]').click();
        await this.page.locator('//button[@class="button btn--rounded btn-primary"]').click();
    }
}
