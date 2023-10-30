import path from 'path';
import axios from 'axios';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { test as setup } from '@playwright/test';
import { getTestVar, TEST_CONST } from '../../envHelper';

async function download(url, archivePath) {
    try {
        const response = await axios.get(url, { responseType: 'stream' });
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

async function downloadAndUnzipMmEx() {
    const mmVersion = getTestVar(TEST_CONST.MM_VERSION);
    const extensionName = `metamask-chrome-${mmVersion}`;

    const url = `https://github.com/MetaMask/metamask-extension/releases/download/v${mmVersion}/${extensionName}.zip`;
    const dataFolderPath = path.resolve(__dirname, '..', '..', 'data', extensionName);
    const pathToArchive = path.resolve(dataFolderPath, `${extensionName}.zip`);

    fs.mkdir(dataFolderPath, (err) => {
        if (err) {
            console.error('Error creating folder by MM extension:', err);
        } else {
            console.log('Folder by MM extension created successfully.');
        }
    });

    await download(url, pathToArchive);

    const zip = new AdmZip(pathToArchive);
    await zip.extractAllTo(dataFolderPath);
    fs.unlink(pathToArchive, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return;
        }
        console.log('Zip archive with MM successfully deleted.');
    });
}

setup('Set env and download metamask extension', async () => {
    await downloadAndUnzipMmEx();
});
