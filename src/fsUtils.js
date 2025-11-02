import { stat } from 'fs/promises';

export async function directoryExists(directoryPath) {
    return (await stat(directoryPath)).isDirectory();
}

export async function fileExists(filePath) {
    return (await stat(filePath)).isFile();
}
