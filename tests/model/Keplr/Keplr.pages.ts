import { BrowserContext, type Page } from '@playwright/test';
import { getTestVar, TEST_CONST } from '../../envHelper';
import { FIVE_SECONDS } from '../../__fixtures__/fixtureHelper';
import util from 'util';

const sleep = util.promisify(setTimeout);

const keprlId = getTestVar(TEST_CONST.PASS_BY_KEPLR_WALLET);
const keplrVersion = getTestVar(TEST_CONST.KEPLR_VERSION);
const password = getTestVar(TEST_CONST.PASS_BY_KEPLR_WALLET);
const walletName = 'Keplr';

const waitKeplrNotifyPage = async (context: BrowserContext) => {
    try {
        await sleep(FIVE_SECONDS); // wait for page load
        await context.pages()[2].title();
    } catch (error) {
        console.error('First try get Keplr notify page is failed.', error, ' Second try...');
        await sleep(FIVE_SECONDS); // wait for page load
        await context.pages()[2].title();
    }
};

const getNotifyKeplrPage = async (context: BrowserContext): Promise<Page> => {
    const expectedKeplrPageTitle = 'Keplr';

    await waitKeplrNotifyPage(context);

    const notifyPage = context.pages()[2];
    const titlePage = await notifyPage.title();

    if (titlePage !== expectedKeplrPageTitle) {
        throw new Error(`Oops, this is not the notify Keplr page. Current title ${titlePage}`);
    }

    return notifyPage;
};

const getHomeKeplrPage = async (context: BrowserContext): Promise<KeplrHomePage> => {
    const expectedKeplrPageTitle = 'Keplr';

    const mainPage = context.pages()[0];
    const titlePage = await mainPage.title();

    if (titlePage !== expectedKeplrPageTitle) {
        throw new Error(`Oops, this is not the Keplr page. Current title ${titlePage}`);
    }
    const page = new KeplrHomePage(mainPage);
    return page;
};

class KeplrHomePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto(`chrome-extension://${keprlId}/register.html`);
    }

    async goToWelcome() {
        await this.page.goto(`chrome-extension://${keprlId}/register.html#/welcome`);
    }

    async gotoSignPage() {
        await this.page.goto(`chrome-extension://${keprlId}/register.html`);
    }

    async addWallet(seed: String) {
        await sleep(FIVE_SECONDS); // wait for page load

        // Navigation to import wallet page
        await this.page.getByText('Create a new wallet').click();
        await this.page.getByText('Import existing recovery phrase').click();
        await this.page.getByText('Use recovery phrase or private key').click();

        // Splitting seed phrase and filling it
        const seedArray = seed.split(' ');

        // Filling seed phrase
        for (const word of seedArray) {
            await this.page.locator(`div[class="sc-gsnTZi jiaani"]:nth-child(${seedArray.indexOf(word) + 1}) input`).fill(word);
        }

        // Confirming seed phrase
        await this.page.getByText('Import', { exact: true }).click();
        await this.page.locator(`form div[class="sc-jdAMXn iRaWtY"] div[class="sc-bZnhIo ArXrE"]:nth-child(1) input`).fill(walletName);
        await this.page.locator(`form div[class="sc-jdAMXn iRaWtY"] div[class="sc-bZnhIo ArXrE"]:nth-child(3) input`).fill(password);
        await this.page.locator(`form div[class="sc-jdAMXn iRaWtY"] div[class="sc-bZnhIo ArXrE"]:nth-child(5) input`).fill(password);
        await this.page.getByText('Next', { exact: true }).click();
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
}

class KeplrNotifyPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async assignPage() {
        await this.page.getByText('Approve', { exact: true }).click();
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

export { keplrVersion, waitKeplrNotifyPage, getNotifyKeplrPage, getHomeKeplrPage, KeplrHomePage, KeplrNotifyPage };
