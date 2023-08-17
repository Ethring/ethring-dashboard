import { expect, type Locator, type Page } from '@playwright/test';
import { metaMaskId } from '../__fixtures__/fixtures';
const sleep = require('util').promisify(setTimeout);

const testSeedPhrase = 'endorse boat cream purpose north toddler panda frame ecology way smile success';
const password = '7v2$O3sS0ZY!';

export const waitMmNotifyWindow = async () => {
    await sleep(5000);
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

    async importExistWallet() {
        await waitMmNotifyWindow();
        await this.page.reload();
        await this.page.locator('input[data-testid=onboarding-terms-checkbox]').click();
        await this.page.locator('button[data-testid=onboarding-import-wallet]').click();
        await this.page.locator('button[data-testid=metametrics-i-agree]').click();
        const myArray = testSeedPhrase.split(' ');
        for (let i = 0; i < myArray.length; i++) {
            await this.page.locator(`input[data-testid=import-srp__srp-word-${i}]`).type(myArray[i]);
        }
        await this.page.click('[data-testid="import-srp-confirm"]');
        await this.page.type('input[data-testid=create-password-new]', password);
        await this.page.type('input[data-testid=create-password-confirm]', password);
        await this.page.locator('input[data-testid=create-password-terms]').click();
        await this.page.click('[data-testid="create-password-import"]');
        await this.page.click('[data-testid="onboarding-complete-done"]');
        await this.page.click('[data-testid="pin-extension-next"]');
        await this.page.click('[data-testid="pin-extension-done"]');
        await this.page.getByText('Try it out').click();
        await this.page.getByText('Enable smart swaps').click();
    }

    async unlockWallet() {
        await this.page.type('[data-testid="unlock-password"]', password);
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

    async addAndAcceptChangeNetwork() {
        await this.page.locator('//button[@class="button btn--rounded btn-primary"]').click();
        await this.page.locator('//button[@class="button btn--rounded btn-primary"]').click();
    }
}
