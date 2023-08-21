import { expect, type Locator, type Page } from '@playwright/test';
import { waitMmNotifyWindow } from './metaMaskPages';
const sleep = require('util').promisify(setTimeout);

const url = 'https://zomet-dev.3ahtim54r.ru/';

export class DashboardPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goToPage() {
        await this.page.goto(url);
    }

    async loginByMetaMask() {
        await this.page.getByText('MetaMask').click();
        await waitMmNotifyWindow();
    }

    async goToSwap() {
        await this.page.getByTestId('sidebar-item-swap').click();
        await this.page.waitForLoadState();
        return new SwapPage(this.page);
    }

    async goToSuperSwap() {
        await this.page.getByTestId('sidebar-item-superSwap').click();
        return new SuperSwapPage(this.page);
    }

    async getLinkFromSuccessPanell() {
        return await this.page.locator('//div[@class="success info-panel mt-10"]//a').getAttribute('href');
    }

    async mockResponseByService(url: String, mockData: object) {
        await this.page.route('**/transfer**', (route) => {
            route.fulfill({
                status: 404,
                contentType: 'text/plain',
                body: 'Not Found!',
            });
        });
    }
}

export class SwapPage extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }

    async swapTokens(amount: string) {
        await this.page.locator("//div[text() = 'Pay']/following-sibling::div//input").type(amount);
        await this.page.click('[class="xl button simple-swap__btn mt-10"]');
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await waitMmNotifyWindow();
    }

    async openAccordionWithNetworks() {
        await this.page.getByTestId('select-network').click();
    }

    async selectNetworkBySwap(netName: String) {
        await this.openAccordionWithNetworks();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
        await waitMmNotifyWindow();
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
        await waitMmNotifyWindow();
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

    async setNetworkToWithSleep(netName: string) {
        await sleep(8000);

        await this.page.locator('(//div[@class="select__panel"])[2]').click();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
    }

    async setAmount(amount: string) {
        await this.page.locator('(//input[@data-qa="input-amount"])[1]').type(amount);
    }

    async setDataAndClickSwap(net: string, amount: string) {
        await this.setNetworkToWithSleep(net);
        await this.setAmount(amount);
        await this.page.click('//button/div[text()="CONFIRM"]');

        await sleep(10000);
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }
}
