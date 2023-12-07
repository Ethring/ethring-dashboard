import path from 'path';
import axios from 'axios';
import fs from 'fs';
import AdmZip from 'adm-zip';

import { test as setup } from '@playwright/test';

// Helpers
import { getTestVar, TEST_CONST } from '../../envHelper';

async function download(url: string, archivePath: string): Promise<void> {
    try {
        if (fs.existsSync(archivePath)) {
            return console.info(`[E2E-TEST] MetaMask Archive ${archivePath} already exist`);
        }

        const response = await axios.get(url, { responseType: 'stream' });

        if (response.status !== 200) {
            throw Error(`Download from ${url} finish with status ${response.status}`);
        }

        const writer = fs.createWriteStream(archivePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Download from ${url} finish with error: ${error.message}`);
    }
}

function getMetaMaskVersion(): { url: string; name: string } {
    // Link to the MetaMask extension
    const GITHUB_MM_LINK = 'https://github.com/MetaMask/metamask-extension/releases/download';

    // Current version of the MetaMask extension
    const VERSION = getTestVar(TEST_CONST.MM_VERSION);

    // Extension name to download
    const EXT_NAME = `metamask-chrome-${VERSION}`;

    const url = `${GITHUB_MM_LINK}/v${VERSION}/${EXT_NAME}.zip`;

    console.info('[E2E-TEST] MetaMask Download URL: ', url);

    return {
        url,
        name: EXT_NAME,
    };
}

async function unzipArchive(archivePath: string, dataFolderPath: string): Promise<void> {
    try {
        console.time('unzip');
        const zip = new AdmZip(archivePath);
        await zip.extractAllTo(dataFolderPath);
        console.timeEnd('unzip');
    } catch (error) {
        console.error('Error during unzip:', error.message);
    }
}

async function downloadAndUnzipMmEx() {
    const { url, name } = getMetaMaskVersion();

    // Path to the folder with the MetaMask extension
    const dataFolderPath = path.resolve(__dirname, '..', '..', 'data', name);

    // Path to the archive with the MetaMask extension
    const pathToArchive = path.resolve(dataFolderPath, `${name}.zip`);

    console.time('mkdirSync');
    // * Create folder if not exist
    fs.mkdirSync(dataFolderPath, { recursive: true });
    console.timeEnd('mkdirSync');

    console.time('download');
    // * Download and unzip MetaMask extension
    await download(url, pathToArchive);
    console.timeEnd('download');

    // * Unzip archive
    await unzipArchive(pathToArchive, dataFolderPath);

    console.time('unlinkSync');
    // * Remove archive
    fs.unlinkSync(pathToArchive);
    console.timeEnd('unlinkSync');
}

setup('Set env and download metamask extension', async () => {
    console.time('Download-mm');
    await downloadAndUnzipMmEx();
    console.timeEnd('Download-mm');
});
