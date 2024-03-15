import fs from 'fs';
import path from 'path';

export default function chunkSizeControlPlugin({ maxSize }) {
    return {
        name: 'chunk-size-control-plugin',
        async writeBundle() {
            const distDirectory = path.resolve(__dirname, '../dist/js');

            const chunkFiles = fs.readdirSync(distDirectory).filter((fileName) => fileName.endsWith('.js'));

            for (const fileName of chunkFiles) {
                const chunkPath = path.join(distDirectory, fileName);
                const stats = await fs.promises.stat(chunkPath);
                const size = stats.size;

                if (size > maxSize) {
                    console.error(`\x1b[31m Error: Chunk ${fileName} exceeds size limit (${size} bytes > ${maxSize} bytes). \x1b[0m`);
                    process.exit(1); // Stop the build process
                }
            }
        },
    };
}
