import { BrowserContext, type Page } from '@playwright/test';
import { getTestVar, TEST_CONST } from '../../envHelper';
import { FIVE_SECONDS } from '../../__fixtures__/fixtureHelper';
import util from 'util';

const sleep = util.promisify(setTimeout);

const metaMaskId = getTestVar(TEST_CONST.MM_ID);
const metamaskVersion = getTestVar(TEST_CONST.MM_VERSION);
const password = getTestVar(TEST_CONST.PASS_BY_MM_WALLET);

const waitMmNotifyPage = async (context: BrowserContext) => {
    try {
        await sleep(FIVE_SECONDS); // wait for page load
        await context.pages()[2].title();
    } catch (error) {
        console.error('First try get mm notify page is failed.', error, ' Second try...');
        await sleep(FIVE_SECONDS); // wait for page load
        await context.pages()[2].title();
    }
};

const getNotifyMmPage = async (context: BrowserContext): Promise<Page> => {
    const expectedMmPageTitle = 'MetaMask';

    await waitMmNotifyPage(context);

    const notifyPage = context.pages()[2];
    const titlePage = await notifyPage.title();

    if (titlePage !== expectedMmPageTitle) {
        throw new Error(`Oops, this is not the notify MM page. Current title ${titlePage}`);
    }

    return notifyPage;
};

const getHomeMmPage = async (context: BrowserContext, indexMmPage = 0): Promise<MetaMaskHomePage> => {
    const expectedMmPageTitle = 'MetaMask';

    const mainPage = context.pages()[indexMmPage];
    const titlePage = await mainPage.title();

    if (titlePage !== expectedMmPageTitle) {
        throw new Error(`Oops, this is not the MM page. Current title ${titlePage}`);
    }
    const page = new MetaMaskHomePage(mainPage);
    await page.closeWhatsNewNotify();
    return page;
};

class MetaMaskHomePage {
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

    async closeWhatsNewNotify() {
        await this.page.locator("//button[@data-testid='popover-close']").click();
    }

    async addWallet(seed: string) {
        await sleep(FIVE_SECONDS); // wait for page load
        await this.page.reload();

        // Navigation to import wallet page
        await this.page.locator('input[data-testid=onboarding-terms-checkbox]').click();
        await this.page.locator('button[data-testid=onboarding-import-wallet]').click();
        await this.page.locator('button[data-testid=metametrics-i-agree]').click();

        // Splitting seed phrase and filling it
        const seedArray = seed.split(' ');

        // Filling seed phrase
        for (const word of seedArray) {
            await this.page.locator(`input[data-testid=import-srp__srp-word-${seedArray.indexOf(word)}]`).fill(word);
        }

        // Confirming seed phrase
        await this.page.click('[data-testid="import-srp-confirm"]');
        await this.page.fill('input[data-testid=create-password-new]', password);
        await this.page.fill('input[data-testid=create-password-confirm]', password);
        await this.page.locator('input[data-testid=create-password-terms]').click();
        await this.page.click('[data-testid="create-password-import"]');
        await this.page.click('[data-testid="onboarding-complete-done"]');
        await this.page.click('[data-testid="pin-extension-next"]');
        await this.page.click('[data-testid="pin-extension-done"]');
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

    async addNetwork(network: string) {
        await this.page.locator('[data-testid="network-display"]').click();
        await this.page.getByText('Add network').click();
        await this.page.locator(`//h6[text()='${network}']/../../..//button`).click();
        await this.page.locator('[data-testid="confirmation-submit-button"]').click();
        await this.page.locator('button.home__new-network-added__switch-to-button').click();
    }
}

class MetaMaskNotifyPage {
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

    async rejectTx() {
        await this.page.click('[data-testid="page-container-footer-cancel"]');
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

    async changeNetwork() {
        await this.page.click('[data-testid="confirmation-submit-button"]');
        await this.page.click('[data-testid="confirmation-submit-button"]');
    }
}

export { metamaskVersion, waitMmNotifyPage, getNotifyMmPage, getHomeMmPage, MetaMaskHomePage, MetaMaskNotifyPage };
