import path from 'node:path';
import { readdir, stat, writeFile, mkdir, rename } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ConsoleLogStream } from './consoleLogStream.js';

export const MSG_OPERATION_FAILED = 'Operation failed';
export const MSG_INVALID_INPUT = 'Invalid input';

export const commands = {
    'up': async (_, currentDirectory) => {
        const nextDirectory = path.resolve(currentDirectory, '..');

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

        const nextDirectory = path.resolve(currentDirectory, args[0]);

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
    'cat': async (args, currentDirectory) => {
        if (!args[0]) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        console.log();
        await pipeline(
            createReadStream(path.resolve(currentDirectory, args[0])),
            new ConsoleLogStream(),
        );
        console.log();

        return currentDirectory;
    },
    'add': async (args, currentDirectory) => {
        if (!args[0] || path.basename(args[0]) !== args[0]) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        await writeFile(path.resolve(currentDirectory, args[0]), '');

        return currentDirectory;
    },
    'mkdir': async (args, currentDirectory) => {
        if (!args[0] || path.basename(args[0]) !== args[0]) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        await mkdir(path.resolve(currentDirectory, args[0]));

        return currentDirectory;
    },
    'rn': async (args, currentDirectory) => {
        if (
            !args[0]
            || !args[1]
            || path.basename(args[1]) !== args[1]
        ) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        await rename(
            path.resolve(currentDirectory, args[0]),
            path.resolve(currentDirectory, path.dirname(args[0]), args[1]),
        );

        return currentDirectory;
    },
    'cp': async (args, currentDirectory) => {
        if (
            !args[0]
            || !args[1]
            || !(await fileExists(path.resolve(currentDirectory, args[0])))
        ) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        await pipeline(
            createReadStream(path.resolve(currentDirectory, args[0])),
            createWriteStream(path.resolve(currentDirectory, args[1], path.basename(args[0]))),
        );

        return currentDirectory;
    },
};

async function directoryExists(directoryPath) {
    return (await stat(directoryPath)).isDirectory();
}

async function fileExists(filePath) {
    return (await stat(filePath)).isFile();
}

