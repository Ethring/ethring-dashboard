import fs from 'fs';
import path from 'path';

export default function chunkSizeControlPlugin({ maxSize }) {
    return {
        name: 'chunk-size-control-plugin',
        async writeBundle() {
            const distDirectory = path.resolve(__dirname, '../dist/js');

            fs.watch(distDirectory, (e, fileName) => {
                if (fileName.endsWith('.js')) {
                    const filePath = path.join(distDirectory, fileName);
                    fs.stat(filePath, (err, { size }) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        if (size > maxSize) {
                            console.error(
                                `\x1b[31m Error: Chunk ${fileName} exceeds size limit (${size} bytes > ${maxSize} bytes). \x1b[0m`,
                            );
                            process.exit(1); // Stop the build process
                        }
                    });
                }
            });
        },
    };
}
