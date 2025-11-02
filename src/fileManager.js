import * as path from 'node:path';
import * as os from 'node:os';
import { stat } from 'fs/promises';

const MSG_OPERATION_FAILED = 'Operation failed';
const MSG_INVALID_INPUT = 'Invalid input';

const commands = {
    'up': (_, currentDirectory) => {
        return path.join(currentDirectory, '..');
    },
    'cd': async (args, currentDirectory) => {
        if (!args[0]) {
            console.log(MSG_INVALID_INPUT);
            return currentDirectory;
        }

        const newDirectory = path.join(currentDirectory, args[0]);

        if ((await stat(newDirectory)).isDirectory() === false) {
            console.log(MSG_OPERATION_FAILED);
            return currentDirectory;
        }

        return newDirectory;
    },
};

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
        currentDirectory = await processCommand(commandParts.slice(1), currentDirectory);
    } else {
        console.log(MSG_INVALID_INPUT);
    }
    return currentDirectory;
}

function printCurrentDirectory(currentDirectory) {
    console.log(`You are currently in ${currentDirectory}\n`);
}

export { runFileManager };