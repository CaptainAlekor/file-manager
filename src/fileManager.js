import * as path from 'node:path';
import * as os from 'node:os';
import { stat, readdir } from 'fs/promises';

const MSG_OPERATION_FAILED = 'Operation failed';
const MSG_INVALID_INPUT = 'Invalid input';

const commands = {
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
        ]

        console.table(sortedDirectoryEntries);

        return currentDirectory;
    },
};

async function directoryExists(directory) {
    return (await stat(directory)).isDirectory();
}

function runFileManager() {
    let currentDirectory = os.homedir();

    printCurrentDirectory(currentDirectory);

    process.stdin.on('data', async (data) => {
        currentDirectory = await handleUserInput(data.toString().trim(), currentDirectory);
        printCurrentDirectory(currentDirectory);
    });
}

async function handleUserInput(input, currentDirectory) {
    const commandParts = input.split(' ');
    const command = commandParts[0];
    const processCommand = commands[command];
    if (processCommand) {
        try {
            currentDirectory = await processCommand(commandParts.slice(1), currentDirectory);
        } catch (_) {
            console.log(MSG_OPERATION_FAILED);
        }
    } else {
        console.log(MSG_INVALID_INPUT);
    }
    return currentDirectory;
}

function printCurrentDirectory(currentDirectory) {
    console.log(`You are currently in ${currentDirectory}\n`);
}

export { runFileManager };