const path = require('path');
const axios = require('axios');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { test: setup, expect } = require('@playwright/test');

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
        throw new Error(`Ошибка при скачивании: ${error.message}`);
    }
}

async function dowonloadAndUnzipMmEx() {
    const url = 'https://github.com/MetaMask/metamask-extension/releases/download/v10.34.0/metamask-chrome-10.34.0.zip';
    const dataFolderPath = path.resolve(__dirname, '..', 'data', 'metamask-chrome-10.34.0');
    const pathToArchive = path.resolve(dataFolderPath, 'metamask-chrome-10.34.0.zip');

    await download(url, pathToArchive);

    const zip = new AdmZip(pathToArchive);
    await zip.extractAllTo(dataFolderPath);
    fs.unlink(pathToArchive, (err) => {
        if (err) {
            console.error('Ошибка удаления файла:', err);
            return;
        }
        console.log('Файл успешно удален.');
    });
}

setup('Download and unzip metamask extension', async () => {
    console.log('Start setup');

    await dowonloadAndUnzipMmEx();

    console.log('Finish setup');
});
