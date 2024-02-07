import path from "path";
import fs from 'fs';
import { MetaMaskDirPath, KeplrDirPath } from "../data/constants";

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
