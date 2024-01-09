import { BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { MetaMaskHomePage, metamaskVersion } from '../model/MetaMask/MetaMask.pages';
import { KeplrHomePage, keplrVersion } from '../model/Keplr/Keplr.pages';
import { MetaMaskDirPath, KeplrDirPath } from '../data/constants';

export const FIVE_SECONDS = 5000;
const sleep = require('util').promisify(setTimeout);

export const closeEmptyPages = async (context: BrowserContext) => {
    await sleep(FIVE_SECONDS);
    const allStartPages = context.pages();

    for (const page of allStartPages) {
        const pageTitle = await page.title();
        if (pageTitle === '') {
            await page.close();
        }
    }
};

export const getPathToMmExtension = () => {
    return path.join(__dirname, '..', `/data/metamask-chrome-${metamaskVersion}`);
};

export const getPathToKeplrExtension = () => {
    return path.join(__dirname, '..', `/data/keplr-extension-manifest-v2-v${keplrVersion}`);
};

export const addWalletToMm = async (context: BrowserContext, seed: String) => {
    await closeEmptyPages(context);
    const metaMaskPage = new MetaMaskHomePage(context.pages()[0]);
    await metaMaskPage.addWallet(seed);
    return;
};

export const addWalletToKeplr = async (context: BrowserContext, seed: String) => {
    await closeEmptyPages(context);
    const keplrPage = new KeplrHomePage(context.pages()[0]);
    await keplrPage.addWallet(seed);
};

const clearDirectory = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = path.join(dirPath, file);

            if (fs.statSync(filePath).isDirectory()) {
                clearDirectory(filePath);
                fs.rmdirSync(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        });

        console.log(`Содержимое директории ${dirPath} успешно удалено.`);
    } else {
        console.log(`Директория ${dirPath} не существует.`);
    }
};

export const deleteAllExtensionsIfTestLocalRun = () => {
    if (!process.env.CI) {
        clearDirectory(MetaMaskDirPath);
        clearDirectory(KeplrDirPath);
    }
};
