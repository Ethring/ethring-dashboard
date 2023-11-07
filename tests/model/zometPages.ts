import { expect, type Locator, type Page } from '@playwright/test';
import { sleepFiveSecond } from './metaMaskPages';

const sleep = require('util').promisify(setTimeout);

const url: string = '/';

export class DashboardPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goToPage() {
        await this.page.goto(url);
    }

    async clickLoginByMetaMask() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.getByTestId('EVM Ecosystem wallet').click();
        await this.page.getByText('MetaMask').click();
    }

    async goToSend() {
        await this.page.getByTestId('sidebar-item-send').click();
        return new SendPage(this.page);
    }

    async goToSwap() {
        await this.page.getByTestId('sidebar-item-swap').click();
        await this.page.waitForLoadState();
        return new SwapPage(this.page);
    }

    async goToBridge() {
        await this.page.getByTestId('sidebar-item-bridge').click();
        await this.page.waitForLoadState();
        return new BridgePage(this.page);
    }

    async goToSuperSwap() {
        await this.page.getByTestId('sidebar-item-superSwap').click();
        return new SuperSwapPage(this.page);
    }

    async waitMainElementVisible() {
        await this.page.getByTestId('dashboard').waitFor({ state: 'visible', timeout: 20000 });
    }

    async getLinkFromSuccessPanel() {
        return await this.page.locator('//div[@class="success info-panel mt-10"]//a').getAttribute('href');
    }

    async mockBalanceRequest(net: string, mockData: object) {
        await this.page.route(
            `**/srv-data-provider/api/balances?net=${net}&address=0xd22b3757b5b7010aa1c4293b38e2e0d53fbe5efc**`,
            (route) => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json; charset=utf-8',
                    body: JSON.stringify(mockData),
                });
            }
        );
    }

}

export class SwapPage extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }

    async swapTokens(amount: string) {
        await this.page.locator("//div[text() = 'Pay']/following-sibling::div//input").fill(amount);
        await this.page.click('button.simple-swap__btn');
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await sleepFiveSecond();
    }

    async openAccordionWithNetworks() {
        await this.page.getByTestId('select-network').click();
    }

    async selectNetworkBySwap(netName: string) {
        await this.openAccordionWithNetworks();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
        await sleepFiveSecond();
    }

    async changeNetworkBySwap(netName: string) {
        let needMmApprove = false;
        if ((await this.getCurrentNetInSwap()) !== netName) {
            needMmApprove = true;
            await this.selectNetworkBySwap(netName);
        }
        return needMmApprove;
    }

    async getCurrentNetInSwap() {
        await sleepFiveSecond();
        await this.page.waitForLoadState();
        return await this.page.locator('//div[@data-qa="select-network"]//div[@class="name"]').textContent();
    }

    async setTokenFromInSwap(token: String) {
        await this.page.locator('(//*[@data-qa="select-token"])[1]').click();
        await this.page.locator(`//div[@class="select-token__item"]//div[text()="${token}"]`).click();
    }

    async getTokenFrom() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[1]').textContent();
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }

    async setTokenToInSwap(token: String) {
        await this.page.locator('(//*[@data-qa="select-token"])[2]');
        await this.page.locator(`//div[@class="select-token__item"]//div[text()="${token}"]`).click();
    }
}

export class SuperSwapPage extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }

    async setNetworkTo(netName: string) {
        await this.page.locator('(//div[@class="select__panel"])[2]').click();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
    }

    async setAmount(amount: string) {
        await this.page.locator('(//input[@data-qa="input-amount"])[1]').fill(amount);
    }

    async setDataAndClickSwap(net: string, amount: string) {
        await this.setNetworkTo(net);
        await this.setAmount(amount);
        await this.page.click('//button/div[text()="CONFIRM"]');

        await sleep(10000);
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }
}

export class SendPage extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }

    async setNetworkTo(netName: string) {
        await this.page.getByTestId('select-network').click();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
    }

    async setAddressTo(address: string) {
        await this.page.getByTestId('input-address').fill(address);
    }

    async setAmount(amount: string) {
        await this.page.waitForSelector('span.ant-skeleton-input', { state: 'hidden', timeout: 10000 });
        await this.page.getByTestId('input-amount').fill(amount);
    }
    async clickConfirm() {
        await this.page.click('//button/div[text()="Confirm"]');
        await sleep(10000);
    }

    async setDataAndClickConfirm(net: string, address: string, amount: string) {
        await this.setNetworkTo(net);
        await this.setAddressTo(address);
        await this.setAmount(amount);
        await this.clickConfirm();
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }
}

export class BridgePage extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }
}
