const fs = require('fs');
const path = require('path');
const { test: teardown, expect } = require('@playwright/test');

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

teardown(`Delete extension's files`, () => {
    const directoryPath = path.resolve(__dirname, '..', 'data', 'metamask-chrome-10.34.0');

    clearDirectory(directoryPath);
});
