import path from 'node:path';
import { readdir, stat, writeFile, mkdir, rename, unlink } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ConsoleLogStream } from './consoleLogStream.js';
import { EOL, arch, cpus, homedir, userInfo } from 'os';
import { createHash } from 'crypto';
import { createBrotliCompress, createBrotliDecompress } from 'zlib';

export const MSG_OPERATION_FAILED = 'Operation failed';
export const MSG_INVALID_INPUT = 'Invalid input';

const osCommandArgs = {
    '--EOL': EOL,
    '--cpus':
        `Cpus count: ${cpus().length}\n`
        + cpus().map((cpu, index) => `${index}: ${cpu.model} ${cpu.speed / 1000} GHz`).join('\n'),
    '--homedir': homedir(),
    '--username': userInfo().username,
    '--architecture': arch(),
};

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
    'mv': async (args, currentDirectory) => {
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
        await unlink(path.resolve(currentDirectory, args[0]));

        return currentDirectory;
    },
    'rm': async (args, currentDirectory) => {
        if (
            !args[0]
            || !(await fileExists(path.resolve(currentDirectory, args[0])))
        ) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        await unlink(path.resolve(currentDirectory, args[0]));

        return currentDirectory;
    },
    'os': async (args, currentDirectory) => {
        if (!args[0] || !(args[0] in osCommandArgs)) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        console.log(osCommandArgs[args[0]]);

        return currentDirectory;
    },
    'hash': async (args, currentDirectory) => {
        if (!args[0] || !(await fileExists(path.resolve(currentDirectory, args[0])))) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        const hashStream = createHash('sha256');

        await pipeline(
            createReadStream(path.resolve(currentDirectory, args[0])),
            hashStream,
        );
        console.log(hashStream.digest('hex'));

        return currentDirectory;
    },
    'compress': async (args, currentDirectory) => {
        if (
            !args[0]
            || !args[1]
            || !(await fileExists(path.resolve(currentDirectory, args[0])))
            || !(await directoryExists(path.resolve(currentDirectory, args[1])))
        ) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        const archiveSource = path.resolve(currentDirectory, args[0]);
        await pipeline(
            createReadStream(archiveSource),
            createBrotliCompress(),
            createWriteStream(path.resolve(currentDirectory, args[1], path.basename(archiveSource) + '.br')),
        );

        return currentDirectory;
    },
    'decompress': async (args, currentDirectory) => {
        if (
            !args[0]
            || !args[1]
            || !(await fileExists(path.resolve(currentDirectory, args[0])))
            || !(await directoryExists(path.resolve(currentDirectory, args[1])))
        ) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        const archiveSource = path.resolve(currentDirectory, args[0]);

        await pipeline(
            createReadStream(archiveSource),
            createBrotliDecompress(),
            createWriteStream(
                path.resolve(currentDirectory, args[1], path.basename(archiveSource).slice(0, -3)),
            ),
        );

        return currentDirectory;
    },
    '.exit': async () => {
        process.exit();
    },
};

async function directoryExists(directoryPath) {
    return (await stat(directoryPath)).isDirectory();
}

async function fileExists(filePath) {
    return (await stat(filePath)).isFile();
}

