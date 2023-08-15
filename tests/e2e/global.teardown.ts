const fs = require('fs');
const path = require('path');
const { test: teardown, expect } = require('@playwright/test');

teardown(`Delete extension's files`, () => {
    const directoryPath = path.resolve(__dirname, '..', 'data', 'metamask-chrome-10.34.0');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Ошибка чтения директории:', err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Ошибка удаления файла:', err);
                    return;
                }
                console.log(`Файл ${file} успешно удален.`);
            });
        });
    });
});
