const path = require('path');
const axios = require('axios');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { test: setup } = require('@playwright/test');
const dotenv = require('dotenv');

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
        throw new Error(`Download error: ${error.message}`);
    }
}

async function dowonloadAndUnzipMmEx() {
    const mmVersion = 'metamask-chrome-10.34.0';
    const url = `https://github.com/MetaMask/metamask-extension/releases/download/v10.34.0/${mmVersion}.zip`;
    const dataFolderPath = path.resolve(__dirname, '..', 'data', mmVersion);
    const pathToArchive = path.resolve(dataFolderPath, `${mmVersion}.zip`);

    fs.mkdir(dataFolderPath, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully.');
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
    await dotenv.config({
        path: '.env.test',
        override: true
      });
    await dowonloadAndUnzipMmEx();
});
