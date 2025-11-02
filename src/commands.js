import path from 'node:path';
import { readdir, stat } from 'fs/promises';

export const MSG_OPERATION_FAILED = 'Operation failed';
export const MSG_INVALID_INPUT = 'Invalid input';

export const commands = {
    'up': async (_, currentDirectory) => {
        const nextDirectory = path.join(currentDirectory, '..');

        if (await directoryExists(nextDirectory) === false) {
            console.log(MSG_OPERATION_FAILED);
            return currentDirectory;
        }

        return nextDirectory;
    },
    'cd': async (args, currentDirectory) => {
        if (!args[0]) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        const nextDirectory = path.join(currentDirectory, args[0]);

        if (await directoryExists(nextDirectory) === false) {
            console.log(MSG_OPERATION_FAILED);
            return currentDirectory;
        }

        return nextDirectory;
    },
    'ls': async (_, currentDirectory) => {
        const directoryEntries = (await readdir(currentDirectory, { withFileTypes: true }))
            .map(entry => {
                return {
                    name: entry.name,
                    type: (() => {
                        if (entry.isFile()) {
                            return 'file';
                        } else if (entry.isDirectory()) {
                            return 'directory';
                        } else {
                            return 'other';
                        }
                    })(),
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        const sortedDirectoryEntries = [
            ...directoryEntries.filter(entry => entry.type === 'directory'),
            ...directoryEntries.filter(entry => entry.type === 'file'),
            ...directoryEntries.filter(entry => entry.type === 'other'),
        ];

        console.table(sortedDirectoryEntries);

        return currentDirectory;
    },
};

async function directoryExists(directory) {
    return (await stat(directory)).isDirectory();
}